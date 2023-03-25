import { Request, Response, NextFunction } from 'express'
import validator from 'validator'
import { Redis } from '@/libs/lib.redis'
import { JsonWebToken } from '@/libs/lib.jwt'

export const auth = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const redis: InstanceType<typeof Redis> = new Redis(0)
    const jwt: InstanceType<typeof JsonWebToken> = new JsonWebToken()

    const headers: Record<string, any> = req.headers as any
    const key: string = ''

    if (!headers.hasOwnProperty('autorization')) throw new Error('Authorization is required on headers')
    else if (!Array.isArray(headers.autorization.match('Bearer'))) throw new Error('Authorization must be include bearer')

    const autorization: string = headers.autorization.split('Bearer ')[1]
    if (!validator.isJWT(autorization)) throw new Error('JWT format is not valid')

    const token: string | null = await redis.getCacheData(`${key}token`)
    if (autorization != token) throw new Error('Unauthorized JWT token miss match')

    const isVerify: any = await jwt.verify(key, autorization as string)
    if (!validator.isJWT(isVerify)) throw new Error(isVerify)

    req['user'] = {}

    next()
  } catch (e: any) {
    return res.status(401).json({ statCode: 401, statMessage: e.message })
  }
}
