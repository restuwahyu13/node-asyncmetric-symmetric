import { Request, Response, NextFunction } from 'express'
import crypto from 'crypto'
import moment from 'moment'
import validator from 'validator'
import { Redis } from '@libs/lib.redis'
import { ISignatureMetadata } from '@libs/lib.jwt'
import { Encryption } from '@helpers/helper.encryption'

export const signature = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const redis: InstanceType<typeof Redis> = new Redis(0)

    const headers: Record<string, any> = req.headers
    if (!headers.hasOwnProperty('x-signature')) throw new Error('X-Signature is required on headers')
    else if (!headers.hasOwnProperty('x-timestamp')) throw new Error('X-Timestamp is required on headers')

    const xSignature: string = req.headers['x-signature'] as any
    const xTimestamp: string = req.headers['x-timestamp'] as any

    const key: string = req['user']['email']
    const dateNow: string = moment().format('YYYY-MM-DD HH:mm:ss')

    if (validator.isEmpty(xSignature)) throw new Error('X-Signature not to be empty')
    else if (validator.isEmpty(xTimestamp)) throw new Error('X-Timestamp not to be empty')
    else if (!validator.isBase64(xSignature)) throw new Error('X-Signature must be base64 format')
    else if (!validator.isDate(xTimestamp)) throw new Error('X-Timestamp must be date format')

    const signature: ISignatureMetadata = await redis.hgetCacheData('jwt', `${key}signature`)
    if (!!signature) throw new Error('X-Signature invalid')

    const [getHmacSigPayloadKey, getHmacSigPayload]: [number, string] = await Promise.all([
      redis.keyCacheDataExist(signature.cipherKey.substring(0, 5)),
      redis.getCacheData(signature.cipherKey.substring(0, 5))
    ])

    const rsaPrivKey: crypto.KeyLike = crypto.createPrivateKey(signature.privKey as crypto.PrivateKeyInput)
    if (!rsaPrivKey) throw new Error('X-Signature invalid')

    if (!getHmacSigPayloadKey || !getHmacSigPayload) throw new Error('X-Signature invalid')
    const isVerified: boolean = Encryption.HMACSHA512Verify(rsaPrivKey, 'base64', getHmacSigPayload, xSignature)

    if (!isVerified) {
      await Promise.all([redis.delCacheData(signature.cipherKey.substring(0, 5)), delete req.headers['x-signature'], delete req.headers['x-timestamp']])
      throw new Error('X-Signature not verified')
    } else if (xTimestamp < dateNow) {
      await Promise.all([redis.delCacheData(signature.cipherKey.substring(0, 5)), delete req.headers['x-signature'], delete req.headers['x-timestamp']])
      throw new Error('X-Timestamp expired')
    }

    next()
  } catch (e: any) {
    return res.status(401).json({ statCode: 401, statMessage: e.message })
  }
}
