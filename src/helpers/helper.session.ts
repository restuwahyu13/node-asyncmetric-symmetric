import 'dotenv/config'
import { Redis } from '@/libs/lib.redis'

export const session = async (key: string): Promise<boolean> => {
  const redis: InstanceType<typeof Redis> = new Redis(0)
  const sessionLimit: number = +process.env.SESSION_LIMIT

  const redisKey: string[] = [`${key}session`, `${key}token`, `${key}secretkey`, `${key}signature`]
  const sessionKey: number = parseInt((await redis.keyCacheDataExist(`${key}session`)) as any)

  if (!sessionKey) await redis.config().lpush(`${key}session`, 1)
  else if (sessionKey) {
    const sessionInc: number = +(await redis.config().llen(`${key}session`))
    await redis.config().lpush(`${key}session`, sessionInc + 1)

    if (sessionInc >= sessionLimit) {
      for (let i of redisKey) {
        if ([`${key}secretkey`, `${key}signature`].includes(i)) await redis.hdelCacheData('jwt', i)
        else await redis.delCacheData(i)
      }
      return false
    }
  }

  return true
}
