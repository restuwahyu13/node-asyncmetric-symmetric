import { Redis } from '@libs/lib.redis'
import { Sessions } from '@models/model.sessions'

export const session = async (prefix: string): Promise<boolean> => {
  const redis: InstanceType<typeof Redis> = new Redis(0)
  const sessions: InstanceType<typeof Sessions> = new Sessions()
  const sessionLimit: number = +process.env.SESSION_LOGIN_LIMIT
  const sessionExpired: number = +process.env.JWT_EXPIRED

  const redisKey: string[] = [`${prefix}-session`, `${prefix}-token`, `${prefix}-signatures`, 'secretkey', 'signature']
  const sessionKey: number = +(await redis.keyCacheDataExist(`${prefix}-session`))

  if (!sessionKey) await redis.config().lpush(`${prefix}-session`, 1)
  else if (sessionKey) {
    const sessionInc: number = +(await redis.config().llen(`${prefix}-session`))
    await redis.config().lpush(`${prefix}-session`, sessionInc + 1)
    await redis.config().expire(`${prefix}-session`, sessionExpired)

    if (sessionInc >= sessionLimit) {
      await sessions.model().delete().where({ user_id: prefix, type: 'login' })
      for (let i of redisKey) {
        if ([`${prefix}-signatures`, 'secretkey', 'signature'].includes(i)) await redis.hdelCacheData(`${prefix}-credentials`, i)
        else await redis.delCacheData(i)
      }
      return false
    }
  }

  return true
}
