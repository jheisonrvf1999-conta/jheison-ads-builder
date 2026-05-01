import { Redis } from '@upstash/redis'

let redis: Redis | null = null

export function getRedis(): Redis {
  if (!redis) {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      throw new Error('Upstash Redis environment variables not configured')
    }
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  }
  return redis
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const r = getRedis()
    return await r.get<T>(key)
  } catch {
    return null
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 3600): Promise<void> {
  try {
    const r = getRedis()
    await r.set(key, value, { ex: ttlSeconds })
  } catch {
    // fail silently — cache is non-critical
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const r = getRedis()
    await r.del(key)
  } catch {}
}

export async function cacheIncr(key: string, ttlSeconds = 60): Promise<number> {
  try {
    const r = getRedis()
    const val = await r.incr(key)
    if (val === 1) {
      await r.expire(key, ttlSeconds)
    }
    return val
  } catch {
    return 0
  }
}
