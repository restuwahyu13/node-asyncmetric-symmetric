import { Request, Response, NextFunction } from 'express'
import moment from 'moment'
import validator from 'validator'
import status from 'http-status'

import { Redis } from '@libs/lib.redis'
import { ISignatureMetadata } from '@libs/lib.jwt'
import { Encryption } from '@helpers/helper.encryption'
import { apiResponse } from '@helpers/helper.apiResponse'

export const signature = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const redis: InstanceType<typeof Redis> = new Redis(0)
    const encryption: InstanceType<typeof Encryption> = new Encryption()
    const userId: string = req['user']

    const RSA256AndHmac512: any = await encryption.RSA256AndHmac512(req, userId)
    if (typeof RSA256AndHmac512 != 'boolean' && !validator.isBoolean(RSA256AndHmac512)) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: RSA256AndHmac512 })

    const headers: Record<string, any> = req.headers
    if (!headers.hasOwnProperty('X-Signature')) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'X-Signature is required on headers' })
    else if (!headers.hasOwnProperty('X-Timestamp')) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'X-Timestamp is required on headers' })

    const xSignature: string = req.headers['X-Signature'] as any
    const xTimestamp: string = req.headers['X-Timestamp'] as any
    const dateNow: string = moment().utcOffset(0, true).format()

    if (validator.isEmpty(xSignature)) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'X-Signature not to be empty' })
    else if (validator.isEmpty(xTimestamp)) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'X-Timestamp not to be empty' })
    else if (!validator.isBase64(xSignature)) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'X-Signature must be base64 format' })
    else if (!moment(xTimestamp).isValid()) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'X-Timestamp must be date format' })

    const signature: ISignatureMetadata = await redis.hgetCacheData(`${userId}-credentials`, 'signature')
    if (!signature) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'X-Signature invalidx' })

    const [getHmacSigPayloadKey, getHmacSigPayload, getHmacSigKey, getHmacSig]: [number, Record<string, any>, number, Record<string, any>] = await Promise.all([
      redis.hkeyCacheDataExist(`${userId}-signatures`, signature.cipherKey.substring(0, 5)),
      redis.hgetCacheData(`${userId}-signatures`, signature.cipherKey.substring(0, 5)),
      redis.hkeyCacheDataExist(`${userId}-signatures`, signature.cipherKey.substring(0, 10)),
      redis.hgetCacheData(`${userId}-signatures`, signature.cipherKey.substring(0, 10))
    ])

    if (!getHmacSigPayloadKey || !getHmacSigPayload || !getHmacSigKey || !getHmacSig) {
      delete req.headers['X-Signature']
      delete req.headers['X-Timestamp']
      throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'X-Signature invalid' })
    } else if (getHmacSig.time < dateNow || xSignature != getHmacSig.signature) {
      delete req.headers['X-Signature']
      delete req.headers['X-Timestamp']
      throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'X-Signature invalid' })
    }

    const isVerified: boolean = Encryption.HMACSHA512Verify(signature.cipherKey, 'base64', getHmacSigPayload.payload, xSignature)
    if (!isVerified) {
      await Promise.all([
        redis.hdelCacheData(`${userId}-signatures`, signature.cipherKey.substring(0, 5)),
        redis.hdelCacheData(`${userId}-signatures`, signature.cipherKey.substring(0, 10)),
        delete req.headers['X-Signature'],
        delete req.headers['X-Timestamp']
      ])
      throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'X-Signature not verified' })
    }

    next()
  } catch (e: any) {
    if (e instanceof Error) return res.status(status.UNAUTHORIZED).json(apiResponse({ stat_code: status.UNAUTHORIZED, err_message: e.message }))
    else return res.status(e.stat_code).json(e)
  }
}
