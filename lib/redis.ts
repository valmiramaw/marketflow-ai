import Redis from 'ioredis'

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined
}

function createRedisClient() {
  const url = process.env.REDIS_URL
  if (!url) {
    console.warn('REDIS_URL not set — Redis features disabled')
    return null
  }
  return new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  })
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production' && redis) {
  globalForRedis.redis = redis
}

// Rate Limiting Helper
export async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (!redis) return { allowed: true, remaining: limit }

  const current = await redis.incr(key)
  if (current === 1) {
    await redis.expire(key, windowSeconds)
  }
  return {
    allowed: current <= limit,
    remaining: Math.max(0, limit - current),
  }
}

// Cache Helper
export async function cached<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  if (!redis) return fn()

  const hit = await redis.get(key)
  if (hit) return JSON.parse(hit) as T

  const result = await fn()
  await redis.set(key, JSON.stringify(result), 'EX', ttlSeconds)
  return result
}
