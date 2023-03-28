import { Request, Response } from 'express'
import crypto from 'crypto'
import moment from 'moment'
import jose from 'jose'

import { Redis } from '@libs/lib.redis'
import { ISecretMetadata, ISignatureMetadata } from '@libs/lib.jwt'

interface SignatureAuth {
  method: string
  path: string
  payload?: any
}

export class Encryption {
  private redis: InstanceType<typeof Redis>
  private asymmetricPayload: Buffer = Buffer.from('')
  private asymmetricSignature: Buffer = Buffer.from('')
  private symmetricPayload: string = ''
  private signatureExpired: number = 500

  constructor() {
    this.redis = new Redis(0)
    this.signatureExpired = +process.env.SIGNATURE_EXPIRED!
  }

  private async getSecretKey(prefix: string): Promise<ISecretMetadata> {
    const res: ISecretMetadata = await this.redis.hgetCacheData(`${prefix}-credentials`, 'secretkey')
    return res
  }

  private async getSignature(prefix: string): Promise<ISignatureMetadata> {
    const res: ISignatureMetadata = await this.redis.hgetCacheData(`${prefix}-credentials`, 'signature')
    return res
  }

  async RSA256AndHmac512(req: Request, prefix: string): Promise<any> {
    try {
      const dateNow: string = moment().utcOffset(0, true).second(this.signatureExpired).format()
      const body: SignatureAuth = req.body

      const secretkey: ISecretMetadata = await this.getSecretKey(prefix)
      if (!secretkey) return new Error('Invalid credentials')

      const signature: ISignatureMetadata = await this.getSignature(prefix)
      if (!signature) return new Error('Invalid credentials')

      const rsaPubKey: crypto.KeyLike = crypto.createPublicKey(secretkey.pubKey)
      const rsaPrivKey: crypto.KeyObject = crypto.createPrivateKey({
        key: Buffer.from(secretkey.privKey),
        type: 'pkcs8',
        format: 'pem',
        passphrase: secretkey.cipherKey
      })

      if (!rsaPubKey) throw new Error('Invalid signature')
      else if (!rsaPrivKey) throw new Error('Invalid signature')

      if (['PUT', 'PATCH', 'POST'].includes(body.method)) {
        this.asymmetricPayload = Buffer.from(JSON.stringify(body.payload || {}))
        this.asymmetricSignature = crypto.sign('RSA-SHA256', this.asymmetricPayload, rsaPrivKey)
        this.symmetricPayload +=
          body.path +
          '.' +
          body.method +
          '.' +
          req.headers.authorization?.split('Bearer ')[1] +
          '.' +
          this.asymmetricSignature.toString('base64') +
          '.' +
          Encryption.HMACSHA512Sign(Buffer.from(secretkey.cipherKey), 'base64', JSON.stringify(req.headers))
      } else {
        this.asymmetricPayload = Buffer.from(JSON.stringify(body.payload || {}))
        this.asymmetricSignature = crypto.sign('RSA-SHA256', this.asymmetricPayload, rsaPrivKey)
        this.symmetricPayload +=
          body.path +
          '.' +
          body.method +
          '.' +
          req.headers.authorization?.split('Bearer ')[1] +
          '.' +
          this.asymmetricSignature.toString('base64') +
          '.' +
          Encryption.HMACSHA512Sign(Buffer.from(secretkey.cipherKey), 'base64', JSON.stringify(req.headers))
      }

      const verifiedAsymmetricSignature = crypto.verify('RSA-SHA256', Buffer.from(this.asymmetricPayload), rsaPubKey, this.asymmetricSignature)
      if (!verifiedAsymmetricSignature) return new Error('Invalid credentials')

      const [signatureKeyExist1, signatureKeyExist2, signatureKeyPayload]: [number, number, Record<string, any>] = await Promise.all([
        this.redis.hkeyCacheDataExist(`${prefix}-signatures`, signature.cipherKey.substring(0, 5)),
        this.redis.hkeyCacheDataExist(`${prefix}-signatures`, signature.cipherKey.substring(0, 10)),
        this.redis.hgetCacheData(`${prefix}-signatures`, signature.cipherKey.substring(0, 5))
      ])

      let signatureKey: string = ''
      let dateTime: string = ''

      if (!signatureKeyExist1 && !signatureKeyExist2) {
        const symmetricOutput: string = Encryption.HMACSHA512Sign(Buffer.from(signature.cipherKey), 'base64', this.symmetricPayload)
        await this.redis.hsetCacheData(`${prefix}-signatures`, signature.cipherKey.substring(0, 5), this.signatureExpired, { payload: this.symmetricPayload })
        await this.redis.hsetCacheData(`${prefix}-signatures`, signature.cipherKey.substring(0, 10), this.signatureExpired, { time: dateNow, signature: symmetricOutput })

        signatureKey = symmetricOutput
        dateTime = dateNow
      } else if (signatureKeyExist1 && this.symmetricPayload !== signatureKeyPayload.payload) {
        const symmetricOutput: string = Encryption.HMACSHA512Sign(Buffer.from(signature.cipherKey), 'base64', this.symmetricPayload)
        await this.redis.hsetCacheData(`${prefix}-signatures`, signature.cipherKey.substring(0, 5), this.signatureExpired, { payload: this.symmetricPayload })
        await this.redis.hsetCacheData(`${prefix}-signatures`, signature.cipherKey.substring(0, 10), this.signatureExpired, { time: dateNow, signature: symmetricOutput })

        signatureKey = symmetricOutput
        dateTime = dateNow
      } else if (signatureKeyExist1 && signatureKeyExist2) {
        const symmetricOutput: Record<string, any> = await this.redis.hgetCacheData(`${prefix}-signatures`, signature.cipherKey.substring(0, 10))
        signatureKey = symmetricOutput.signature
        dateTime = symmetricOutput.time
      }

      return { signature: signatureKey, timestamp: dateTime }
    } catch (e: any) {
      return e.message
    }
  }

  static AES256Encrypt(secretKey: string, data: string): Buffer {
    const checkValidSecretKey: crypto.KeyObject = crypto.createSecretKey(Buffer.from(secretKey))

    if (!checkValidSecretKey) throw new Error('Secretkey not valid')
    else if (checkValidSecretKey && checkValidSecretKey.symmetricKeySize != 32) throw new Error('Secretkey length miss match')

    const key: Buffer = crypto.scryptSync(secretKey, 'salt', 32, { N: 1024, r: 8, p: 1 })
    const iv: Buffer = crypto.randomBytes(16)

    const cipher: crypto.CipherGCM = crypto.createCipheriv('aes-256-gcm', key, iv)
    const cipherData: Buffer = Buffer.concat([cipher.update(data), cipher.final()])

    return cipherData
  }

  static AES256Decrypt(secretKey: string, cipher: Buffer): Buffer {
    const checkValidSecretKey: crypto.KeyObject = crypto.createSecretKey(Buffer.from(secretKey))

    if (!checkValidSecretKey) throw new Error('Secretkey not valid')
    else if (checkValidSecretKey && checkValidSecretKey.symmetricKeySize != 32) throw new Error('Secretkey length miss match')

    const key: Buffer = crypto.scryptSync(secretKey, 'salt', 32, { N: 1024, r: 8, p: 1 })
    const iv: Buffer = crypto.randomBytes(16)

    const decipher: crypto.DecipherGCM = crypto.createDecipheriv('aes-256-gcm', key, iv)
    return decipher.update(cipher)
  }

  static HMACSHA512Sign(secretKey: crypto.BinaryLike | crypto.KeyObject, encoding: crypto.BinaryToTextEncoding, data: string): string {
    const symmetricSignature: crypto.Hmac = crypto.createHmac('SHA512', secretKey)
    symmetricSignature.update(data)
    return symmetricSignature.digest(encoding).toString()
  }

  static HMACSHA512Verify(secretKey: crypto.BinaryLike | crypto.KeyObject, encoding: crypto.BinaryToTextEncoding, data: string, hash: string): boolean {
    const symmetricSignature: crypto.Hmac = crypto.createHmac('SHA512', secretKey)
    symmetricSignature.update(data)
    return Buffer.compare(Buffer.from(symmetricSignature.digest(encoding).toString()), Buffer.from(hash)) == 0 ? true : false
  }
}
