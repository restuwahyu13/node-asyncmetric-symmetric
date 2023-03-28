import { Request, Response, NextFunction } from 'express'
import validator from 'validator'
import status from 'http-status'
import moment from 'moment'

import { Sessions } from '@models/model.sessions'
import { ISessions } from '@interfaces/interface.sessions'
import { Redis } from '@libs/lib.redis'
import { JsonWebToken } from '@libs/lib.jwt'
import { apiResponse } from '@helpers/helper.apiResponse'

export const authorization = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const redis: InstanceType<typeof Redis> = new Redis()
    const jwt: InstanceType<typeof JsonWebToken> = new JsonWebToken()
    const sessions: InstanceType<typeof Sessions> = new Sessions()

    const headers: Record<string, any> = req.headers as any
    const dateNow: string = moment().utcOffset(0, true).format()

    if (!headers.hasOwnProperty('authorization')) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'Authorization is required on headers' })
    else if (!Array.isArray(headers.authorization.match('Bearer'))) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'Authorization must be include bearer' })

    let tokenAuthorization: string = headers.authorization.split('Bearer ')[1]
    if (!validator.isJWT(tokenAuthorization)) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'Unauthorized JWT format is not valid' })
    tokenAuthorization = tokenAuthorization.trim()

    const sessionToken: ISessions = await sessions.model().select('user_id', 'secret', 'expired_at').where({ secret: tokenAuthorization, type: 'login' }).first()
    if (!sessionToken) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'Unauthorized JWT token expired' })
    else if (sessionToken.expired_at.toString() < dateNow) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'Unauthorized JWT token expired' })

    const accessToken: string = await redis.getCacheData(`${sessionToken.user_id}-token`)
    if (tokenAuthorization != accessToken && sessionToken) {
      await sessions.model().delete().where({ user_id: sessionToken.user_id, type: 'login' })
      throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: 'Unauthorized JWT token expired' })
    }

    const isVerify: any = await jwt.verify(sessionToken.user_id, tokenAuthorization)
    if (!validator.isJWT(isVerify)) throw apiResponse({ stat_code: status.UNAUTHORIZED, err_message: isVerify })

    // set userId for sharing data between component
    req['user'] = sessionToken.user_id

    next()
  } catch (e: any) {
    if (e instanceof Error) return res.status(status.UNAUTHORIZED).json(apiResponse({ stat_code: status.UNAUTHORIZED, err_message: e.message }))
    else return res.status(e.stat_code).json(e)
  }
}
