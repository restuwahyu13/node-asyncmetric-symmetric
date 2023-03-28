import crypto from 'crypto'
import { Request } from 'express'
import * as jose from 'jose'
import { QueryBuilder } from 'objection'
import moment from 'moment'

import { Redis } from '@libs/lib.redis'
import { session } from '@helpers/helper.session'
import { Encryption } from '@helpers/helper.encryption'
import { Jose } from '@libs/lib.jose'
import { ISessions } from '@interfaces/interface.sessions'
import { Sessions } from '@models/model.sessions'

export interface ISecretMetadata {
  pubKey: string
  privKey: string
  cipherKey: string
}

export interface ISignatureMetadata {
  privKey: string
  sigKey: string
  cipherKey: string
  jwkKey: jose.JWK
  jweKey: jose.FlattenedJWE
}

export class JsonWebToken {
  private keyLength: number = 2048
  private keyLengthSizes: number[] = []
  private jwtToken: string = ''
  private jwtSecretKey: string = ''
  private jwtExpired: number = 500
  private redis: InstanceType<typeof Redis>
  private sessions: QueryBuilder<Sessions, Sessions[]>
  private certMetadata: ISecretMetadata = {
    pubKey: '',
    privKey: '',
    cipherKey: ''
  }
  private sigMetadata: ISignatureMetadata = {
    privKey: {} as any,
    sigKey: '',
    cipherKey: '',
    jwkKey: {},
    jweKey: {} as any
  }

  constructor() {
    this.redis = new Redis(0)
    this.sessions = new Sessions().model()
    this.jwtSecretKey = process.env.JWT_SECRET_KEY!
    this.jwtExpired = +process.env.JWT_EXPIRED!
    this.keyLengthSizes = [2048, 4096]
  }

  private async createSecret(prefix: string): Promise<ISecretMetadata> {
    try {
      const secretKeyExist: number = +(await this.redis.hkeyCacheDataExist(`${prefix}-credentials`, 'secretkey'))

      if (!secretKeyExist) {
        for (let i = 0; i < this.keyLengthSizes.length; i++) {
          this.keyLength = this.keyLengthSizes[Math.floor(Math.random() * this.keyLengthSizes.length)]
          break
        }

        const cipherData: Buffer = await Encryption.AES256Encrypt(this.jwtSecretKey, this.jwtSecretKey)
        const genCertifiate: crypto.KeyPairSyncResult<string, string> = crypto.generateKeyPairSync('rsa', {
          modulusLength: this.keyLength,
          publicKeyEncoding: {
            type: 'pkcs1',
            format: 'pem'
          },
          privateKeyEncoding: {
            type: 'pkcs8',
            format: 'pem',
            cipher: 'aes-256-cbc',
            passphrase: cipherData.toString('hex')
          }
        })

        this.certMetadata = {
          pubKey: genCertifiate.publicKey,
          privKey: genCertifiate.privateKey,
          cipherKey: cipherData.toString('hex')
        }
        await this.redis.hsetCacheData(`${prefix}-credentials`, 'secretkey', this.jwtExpired, this.certMetadata as any)
      } else {
        this.certMetadata = (await this.redis.hgetCacheData(`${prefix}-credentials`, 'secretkey')) as any
      }

      return this.certMetadata
    } catch (e: any) {
      return e.message
    }
  }

  private async createSignature(prefix: string, body: any): Promise<ISignatureMetadata> {
    try {
      const sigKeyExist: number = +(await this.redis.hkeyCacheDataExist(`${prefix}-credentials`, 'signature')) as any

      if (!sigKeyExist) {
        const secretKey: ISecretMetadata = await this.createSecret(prefix)
        const rsaPrivKey: crypto.KeyObject = crypto.createPrivateKey({
          key: Buffer.from(secretKey.privKey),
          type: 'pkcs8',
          format: 'pem',
          passphrase: secretKey.cipherKey
        })

        const bodyPayload: string = JSON.stringify(body)
        const signature: Buffer = crypto.sign('RSA-SHA256', Buffer.from(bodyPayload), rsaPrivKey)

        if (!signature) throw new Error('Credential not verified')
        const signatureOutput: string = signature.toString('hex')

        const verifiedSignature = crypto.verify('RSA-SHA256', Buffer.from(bodyPayload), secretKey.pubKey, signature)
        if (!verifiedSignature) throw new Error('Credential not verified')

        const formatPrivkeyToJws: jose.JWK = await Jose.exportJsonWebKey(rsaPrivKey)
        if (!formatPrivkeyToJws) throw new Error('Credential not verified')

        const jweKey: jose.FlattenedJWE = await Jose.JweEncrypt(rsaPrivKey, signatureOutput)
        if (!jweKey) throw new Error('Credential not verified')

        this.sigMetadata = {
          privKey: secretKey.privKey,
          sigKey: signatureOutput,
          cipherKey: secretKey.cipherKey,
          jwkKey: formatPrivkeyToJws,
          jweKey: jweKey
        }

        await this.redis.hsetCacheData(`${prefix}-credentials`, 'signature', this.jwtExpired, this.sigMetadata as any)
      } else {
        this.sigMetadata = (await this.redis.hgetCacheData(`${prefix}-credentials`, 'signature')) as any
      }

      return this.sigMetadata
    } catch (e: any) {
      return e.message
    }
  }

  async sign(req: Request, prefix: string, body: any): Promise<any> {
    try {
      const sessionExist: boolean = await session(prefix)
      const tokenExist: number = await this.redis.keyCacheDataExist(`${prefix}-token`)
      const checkSession: ISessions = await this.sessions.select('secret').where({ user_id: prefix, type: 'login' }).first()

      const signature: ISignatureMetadata = await this.createSignature(prefix, Object.assign(body, req.body))
      const expiredAt: string = moment().utcOffset(0, true).second(this.jwtExpired).format()
      const payload = req.path + '.' + req.method + '.' + signature.sigKey.toLowerCase() + '.' + expiredAt

      const symmetricEncrypt: string = Encryption.HMACSHA512Sign(signature.cipherKey, 'hex', payload)
      const rsaPrivKey: crypto.KeyObject = crypto.createPrivateKey({
        key: Buffer.from(signature.privKey),
        type: 'pkcs8',
        format: 'pem',
        passphrase: signature.cipherKey
      })

      if (sessionExist && !tokenExist && !checkSession) {
        this.jwtToken = await Jose.JwtSign(
          rsaPrivKey,
          signature.jweKey.ciphertext,
          { key: symmetricEncrypt },
          {
            aud: signature.sigKey.substring(10, 20),
            iss: signature.sigKey.substring(20, 30),
            exp: this.jwtExpired
          }
        )

        await Promise.all([
          this.redis.setExCacheData(`${prefix}-token`, this.jwtExpired, this.jwtToken),
          this.sessions.insert({ user_id: prefix, type: 'login', secret: this.jwtToken, expired_at: new Date(expiredAt) })
        ])
      } else {
        this.jwtToken = await this.redis.getCacheData(`${prefix}-token`)
      }

      return this.jwtToken
    } catch (e: any) {
      return e.message
    }
  }

  async verify(prefix: string, token: string): Promise<any> {
    try {
      const verifyToken: any = await new Jose().JwtVerify(prefix, token)
      if (!verifyToken) throw new Error(verifyToken)

      return token
    } catch (e: any) {
      return e.message
    }
  }
}
