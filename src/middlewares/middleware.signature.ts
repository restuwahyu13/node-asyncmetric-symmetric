import { Request, Response, NextFunction } from 'express'
import moment from 'moment'
import validator from 'validator'
import { Redis } from '@/libs/lib.redis'
import { ISignatureMetadata } from '@/libs/lib.jwt'
import { Encryption } from '@helpers/helper.encryption'

export const signature = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const redis: InstanceType<typeof Redis> = new Redis(0)
    const xSignature: any = req.headers['x-signature']
    const xTimestamp: any = req.headers['x-timestamp']
    const dateNow: string = moment().format('YYYY-MM-DD HH:mm:ss')

    const key: string = req['user']['email']
    const redisKey: string[] = [`${key}:activity`, `${key}:jwt`, `${key}:secretkey`, `${key}:signature`]

    if (!xSignature) throw new Error('X-Signature is required on headers')
    else if (!validator.isBase64(xTimestamp)) throw new Error('X-Signature must be base64 format')
    else if (!xTimestamp) throw new Error('X-Timestamp is required on headers')
    else if (!validator.isDate(xTimestamp)) throw new Error('X-Timestamp must be date format')

    const checkSignatureKey: number = await redis.keyCacheDataExist(xSignature.substring(0, 10))
    if (!checkSignatureKey) {
      for (let i of redisKey) {
        if ([`${key}:secretkey`, `${key}:signature`].includes(i)) await redis.hdelCacheData('jwt', i)
        else await redis.delCacheData(i)
      }
      throw new Error('X-Signature expired')
    }

    const [getHmacSigKey, getHmacSigPayloadKey, getHmacSig, getHmacSigPayload, signature]: [number, number, string, string, ISignatureMetadata] = await Promise.all([
      redis.keyCacheDataExist(xSignature.substring(0, 10)),
      redis.keyCacheDataExist(xSignature.substring(0, 5)),
      redis.getCacheData(xSignature.substring(0, 10)),
      redis.getCacheData(xSignature.substring(0, 5)),
      redis.hgetCacheData('jwt', `${key}:signature`)
    ])

    if (!getHmacSigKey || !getHmacSigPayloadKey || !signature || xSignature != getHmacSig) throw new Error('X-Signature invalid')
    else if (xTimestamp < dateNow) throw new Error('X-Timestamp expired')

    const isVerified: boolean = Encryption.HMACSHA512Verify(signature.privKey, 'base64', getHmacSigPayload, getHmacSig)
    if (!isVerified) throw new Error('X-Signature not verified')

    next()
  } catch (e: any) {
    return res.status(401).json({ statCode: 401, statMessage: e.message })
  }
}
