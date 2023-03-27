import { Redis } from '@libs/lib.redis'
import { Sessions } from '@models/model.sessions'

export const session = async (prefix: string): Promise<any> => {
  try {
    const redis: InstanceType<typeof Redis> = new Redis(0)
    const sessions: InstanceType<typeof Sessions> = new Sessions()
    const sessionLimit: number = +process.env.SESSION_LOGIN_LIMIT
    const sessionExpired: number = +process.env.SESSION_EXPIRED

    const redisKey: string[] = [`${prefix}-session`, `${prefix}-token`, `${prefix}-credentials`, `${prefix}-signatures`]

    const sessionCount: number = await redis.config().llen(`${prefix}-session`)
    await redis.config().lpush(`${prefix}-session`, +sessionCount + 1)
    await redis.config().expire(`${prefix}-session`, sessionExpired)

    if (+sessionCount >= sessionLimit) {
      await sessions.model().delete().where({ user_id: prefix, type: 'login' })
      for (let i of redisKey) {
        await redis.config().del(i)
      }

      await redis.config().lpush(`${prefix}-session`, 1)
      await redis.config().expire(`${prefix}-session`, sessionExpired)
    }

    return true
  } catch (e: any) {
    return e.message
  }
}
