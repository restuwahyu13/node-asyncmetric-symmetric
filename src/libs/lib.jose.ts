import * as jose from 'jose'
import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { ISecretMetadata, ISignatureMetadata } from '@libs/lib.jwt'
import { Redis } from '@libs/lib.redis'

export class Jose {
  private redis: InstanceType<typeof Redis>

  constructor() {
    this.redis = new Redis(0)
  }

  static async JweEncrypt(privateKey: jose.KeyLike | crypto.KeyObject, data: string): Promise<jose.FlattenedJWE> {
    try {
      const text: Uint8Array = new TextEncoder().encode(data)
      const jwe: jose.FlattenedEncrypt = new jose.FlattenedEncrypt(text).setProtectedHeader({ alg: 'RSA-OAEP', enc: 'A256CBC-HS512', typ: 'JWT', cty: 'JWT' })
      return await jwe.encrypt(privateKey)
    } catch (e: any) {
      return e.message
    }
  }

  static async JweDecerypt(privateKey: jose.KeyLike | crypto.KeyObject, jweEncryption: jose.FlattenedJWE): Promise<string> {
    try {
      const jwe: jose.FlattenedDecryptResult = await jose.flattenedDecrypt(jweEncryption, privateKey)
      const text: string = new TextDecoder().decode(jwe.plaintext)
      return text
    } catch (e: any) {
      return e.message
    }
  }

  static async importJsonWebKey(jwkExport: jose.JWK): Promise<jose.KeyLike | Uint8Array> {
    try {
      const jwk: jose.KeyLike | Uint8Array = await jose.importJWK(jwkExport)
      return jwk
    } catch (e: any) {
      return e.message
    }
  }

  static async exportJsonWebKey(privateKey: jose.KeyLike | crypto.KeyObject): Promise<jose.JWK> {
    try {
      const jwk: jose.JWK = await jose.exportJWK(privateKey)
      return jwk
    } catch (e: any) {
      return e.message
    }
  }

  static async JwtSign(privateKey: jose.KeyLike | crypto.KeyObject, headerKeyId: string, data: Record<string, any>, options: jose.JWTPayload): Promise<string> {
    try {
      const jwt: string = await new jose.SignJWT(data)
        .setProtectedHeader({ alg: 'RS256', typ: 'JWT', cty: 'JWT', kid: headerKeyId, b64: true })
        .setAudience(options.aud)
        .setIssuer(options.iss)
        .setExpirationTime(options.exp)
        .setJti(options.jti)
        .sign(privateKey)

      return jwt
    } catch (e: any) {
      return e.message
    }
  }

  async JwtVerify(prefix: string, token: string): Promise<string> {
    try {
      const secretkey: ISecretMetadata = await this.redis.hgetCacheData(`${prefix}-credentials`, 'secretkey')
      if (!secretkey) throw new Error('Unauthorized JWT token signature is not verified')

      const signature: ISignatureMetadata = await this.redis.hgetCacheData(`${prefix}-credentials`, 'signature')
      if (!signature) throw new Error('Unauthorized JWT token signature is not verified')

      const rsaPrivKey: crypto.KeyObject = crypto.createPrivateKey(signature.privKey)
      if (!rsaPrivKey) throw new Error('Unauthorized JWT token signature is not verified')

      const jwsVerify: jose.CompactVerifyResult = await jose.compactVerify(token, rsaPrivKey)
      if (!jwsVerify) throw new Error('Unauthorized JWT token signature is not verified')

      const jwkVerify: jose.KeyLike | Uint8Array = await Jose.importJsonWebKey(signature.jwkKey)
      if (!jwkVerify) throw new Error('Unauthorized JWT token signature is not verified')

      const jweVerify: string = await Jose.JweDecerypt(rsaPrivKey, signature.jweKey)
      if (!jweVerify) throw new Error('Unauthorized JWT token signature is not verified')

      if (jwsVerify.protectedHeader.kid !== signature.jweKey.ciphertext) throw new Error('Unauthorized JWT token signature is not verified')
      const jwsVerifyParse: jwt.JwtPayload = JSON.parse(jwsVerify.payload.toString())

      const jwtVerify = await jose.jwtVerify(token, jwkVerify, { audience: signature.sigKey.substring(10, 20), issuer: signature.sigKey.substring(20, 30) })
      if (!jwtVerify) throw new Error('Unauthorized JWT token signature is not verified')
      else if (jwtVerify && !Array.isArray(signature.sigKey.match(jwsVerifyParse.jti))) throw new Error('Unauthorized JWT token signature is not verified')

      return token
    } catch (e: any) {
      return e.message
    }
  }
}
