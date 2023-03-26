import { Request, Response } from 'express'
import crypto, { BinaryToTextEncoding } from 'crypto'
import moment from 'moment'
import yup from 'yup'
import { Redis } from '@/libs/lib.redis'
import { ISecretMetadata, ISignatureMetadata } from '@/libs/lib.jwt'

export class Encryption {
  private redis: InstanceType<typeof Redis>
  private asymmetricPayload: Buffer = Buffer.from('')
  private asymmetricSignature: Buffer = Buffer.from('')
  private symmetricPayload: string = ''
  private signatureExpired: number = 0
  private aesSecretKey: string = ''

  constructor() {
    this.redis = new Redis(0)
    this.signatureExpired = +process.env.SIGNATURE_EXPIRED!
    this.aesSecretKey = process.env.AES_SECRET_KEY!
  }

  private async getSecretKey(key: string): Promise<ISecretMetadata> {
    const res: ISecretMetadata = await this.redis.hgetCacheData('jwt', `${key}secretkey`)
    return res
  }

  private async getSignature(key: string): Promise<ISignatureMetadata> {
    const res: ISignatureMetadata = await this.redis.hgetCacheData('jwt', `${key}signature`)
    return res
  }

  async RSA256AndHmac512(req: Request, res: Response, key: string): Promise<any> {
    try {
      const getSecretKey: ISecretMetadata = await this.getSecretKey(key)
      const getSignature: ISignatureMetadata = await this.getSignature(key)
      const dateNow: string = moment().second(this.signatureExpired).format('YYYY-MM-DD HH:mm:ss')

      if (['PUT', 'PATCH', 'POST'].includes(req.method)) {
        this.asymmetricPayload = Buffer.from(JSON.stringify(req.body))
        this.asymmetricSignature = crypto.sign('RSA-SHA256', this.asymmetricPayload, getSignature.privKey)
        this.symmetricPayload +=
          req.path + '.' + req.method + '.' + req.headers.authorization?.split('Bearer ')[1] + '.' + this.asymmetricSignature.toString('base64') + '.' + dateNow
      } else {
        this.asymmetricPayload = Buffer.from(JSON.stringify(req.params || req.query || ''))
        this.asymmetricSignature = crypto.sign('RSA-SHA256', this.asymmetricPayload, getSignature.privKey)
        this.symmetricPayload +=
          req.path + '.' + req.method + '.' + req.headers.authorization?.split('Bearer ')[1] + '.' + this.asymmetricSignature.toString('base64') + '.' + dateNow
      }

      const rsaPubKey: crypto.KeyLike = crypto.createPublicKey(getSecretKey.pubKey)
      const rsaPrivKey: crypto.KeyLike = crypto.createPrivateKey(getSecretKey.privKey)

      if (!rsaPubKey) throw new Error('Invalid credentials')
      else if (!rsaPrivKey) throw new Error('Invalid credentials')

      const verifiedAsymmetricSignature = crypto.verify('RSA-SHA256', Buffer.from(this.asymmetricPayload), rsaPubKey, this.asymmetricSignature)
      if (!verifiedAsymmetricSignature) return new Error('Invalid credentials')

      const symmetricOutput: string = Encryption.HMACSHA512Sign(rsaPrivKey, 'base64', this.symmetricPayload)
      await this.redis.setExCacheData(getSignature.cipherKey.substring(0, 5), this.signatureExpired, this.symmetricPayload)

      res.set('X-Signature', symmetricOutput.toString())
      res.set('X-Timestamp', dateNow)

      return symmetricOutput
    } catch (e: any) {
      return e.message
    }
  }

  static async AES256Encrypt(secretKey: string, data: string) {
    const checkValidSecretKey: crypto.KeyObject = crypto.createSecretKey(Buffer.from(secretKey))

    if (!checkValidSecretKey) throw new Error('Secretkey not valid')
    else if (checkValidSecretKey && checkValidSecretKey.symmetricKeySize != 32) throw new Error('Secretkey length miss match')

    const key: Buffer = crypto.scryptSync(secretKey, 'salt', 32, { N: 1024, r: 8, p: 1 })
    const iv: Buffer = crypto.randomBytes(16)

    const cipher: crypto.CipherGCM = crypto.createCipheriv('aes-256-gcm', key, iv)
    const cipherData: Buffer = Buffer.concat([cipher.update(data), cipher.final()])

    return cipherData
  }

  static async AES256Decrypt(secretKey: string, cipher: Buffer): Promise<Buffer> {
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
