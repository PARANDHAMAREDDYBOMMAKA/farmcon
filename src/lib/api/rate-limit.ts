import type { NextRequest } from 'next/server'
import { cache } from '@/lib/redis'
import { tooMany } from './response'

export type RateLimitResult = {
  allowed: boolean
  remaining: number
  retryAfter: number
  limit: number
}

export async function rateLimit(opts: {
  key: string
  limit: number
  windowSeconds: number
}): Promise<RateLimitResult> {
  const { key, limit, windowSeconds } = opts
  const fullKey = `farmcon:rl:${key}`

  try {
    const count = (await cache.incr(fullKey, windowSeconds)) || 1
    if (count > limit) {
      const ttl = await cache.ttl(fullKey).catch(() => windowSeconds)
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.max(1, ttl),
        limit,
      }
    }
    return {
      allowed: true,
      remaining: Math.max(0, limit - count),
      retryAfter: 0,
      limit,
    }
  } catch {
    return { allowed: true, remaining: limit, retryAfter: 0, limit }
  }
}

export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown'
  const realIp = request.headers.get('x-real-ip')
  if (realIp) return realIp
  return 'unknown'
}

export async function enforceRateLimit(
  request: NextRequest,
  opts: {
    bucket: string
    limit: number
    windowSeconds: number
    identifier?: string
    requestId?: string
  },
): Promise<Response | null> {
  const ident = opts.identifier || clientIp(request)
  const result = await rateLimit({
    key: `${opts.bucket}:${ident}`,
    limit: opts.limit,
    windowSeconds: opts.windowSeconds,
  })

  if (!result.allowed) {
    return tooMany(
      `Too many requests. Try again in ${result.retryAfter} seconds.`,
      result.retryAfter,
      opts.requestId,
    )
  }
  return null
}
