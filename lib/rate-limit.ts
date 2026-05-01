import { RateLimitResult } from '@/types'

// In-memory fallback store
const store = new Map<string, { count: number; reset: number }>()

function inMemoryRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || entry.reset < now) {
    store.set(key, { count: 1, reset: now + windowMs })
    return { success: true, remaining: limit - 1, reset: now + windowMs }
  }

  if (entry.count >= limit) {
    return { success: false, remaining: 0, reset: entry.reset }
  }

  entry.count++
  return { success: true, remaining: limit - entry.count, reset: entry.reset }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  try {
    if (process.env.UPSTASH_REDIS_REST_URL) {
      const { cacheIncr } = await import('@/lib/redis')
      const windowSecs = Math.ceil(windowMs / 1000)
      const count = await cacheIncr(`rl:${key}`, windowSecs)
      const remaining = Math.max(0, limit - count)
      const reset = Date.now() + windowMs
      return { success: count <= limit, remaining, reset }
    }
  } catch {}
  return inMemoryRateLimit(key, limit, windowMs)
}

export async function rateLimitByIp(
  ip: string,
  preset: 'login' | 'register' | 'analyze' | 'api'
): Promise<RateLimitResult> {
  const presets = {
    login:    { limit: 5,   windowMs: 60_000 },
    register: { limit: 5,   windowMs: 60_000 },
    analyze:  { limit: 10,  windowMs: 3_600_000 },
    api:      { limit: 100, windowMs: 60_000 },
  }
  const { limit, windowMs } = presets[preset]
  return rateLimit(`${preset}:ip:${ip}`, limit, windowMs)
}

export async function rateLimitByUser(
  userId: string,
  preset: 'analyze' | 'api'
): Promise<RateLimitResult> {
  const presets = {
    analyze: { limit: 10,  windowMs: 3_600_000 },
    api:     { limit: 200, windowMs: 60_000 },
  }
  const { limit, windowMs } = presets[preset]
  return rateLimit(`${preset}:user:${userId}`, limit, windowMs)
}

export function getIpFromRequest(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp.trim()
  }
  return '127.0.0.1'
}

// Legacy synchronous presets kept for backward compatibility
export const REGISTER_RATE_LIMIT = { limit: 5,   windowMs: 60 * 1000 }
export const ANALYZE_RATE_LIMIT  = { limit: 10,  windowMs: 60 * 60 * 1000 }
export const API_RATE_LIMIT      = { limit: 100, windowMs: 60 * 1000 }
