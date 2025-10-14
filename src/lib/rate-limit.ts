import { cache } from './redis'

export interface RateLimitConfig {
  interval: number 
  maxRequests: number 
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

export class RateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async check(key: string): Promise<RateLimitResult> {
    const rateLimitKey = `farmcon:ratelimit:${key}`

    try {
      
      const current = await cache.get<number>(rateLimitKey)

      if (current === null) {
        
        await cache.set(rateLimitKey, 1, this.config.interval)

        return {
          success: true,
          limit: this.config.maxRequests,
          remaining: this.config.maxRequests - 1,
          reset: Date.now() + (this.config.interval * 1000)
        }
      }

      const count = typeof current === 'number' ? current : parseInt(String(current))

      if (count >= this.config.maxRequests) {
        
        return {
          success: false,
          limit: this.config.maxRequests,
          remaining: 0,
          reset: Date.now() + (this.config.interval * 1000)
        }
      }

      await cache.set(rateLimitKey, count + 1, this.config.interval)

      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests - (count + 1),
        reset: Date.now() + (this.config.interval * 1000)
      }
    } catch (error) {
      console.error('Rate limit check error:', error)
      
      return {
        success: true,
        limit: this.config.maxRequests,
        remaining: this.config.maxRequests,
        reset: Date.now() + (this.config.interval * 1000)
      }
    }
  }

  async reset(key: string): Promise<void> {
    const rateLimitKey = `farmcon:ratelimit:${key}`
    await cache.del(rateLimitKey)
  }
}

export const rateLimiters = {
  
  api: new RateLimiter({ interval: 60, maxRequests: 100 }),

  auth: new RateLimiter({ interval: 900, maxRequests: 5 }),

  otp: new RateLimiter({ interval: 300, maxRequests: 3 }),

  search: new RateLimiter({ interval: 60, maxRequests: 30 }),

  upload: new RateLimiter({ interval: 3600, maxRequests: 10 }),

  payment: new RateLimiter({ interval: 60, maxRequests: 5 }),
}

export async function withRateLimit(
  identifier: string,
  limiter: RateLimiter = rateLimiters.api
): Promise<RateLimitResult> {
  return await limiter.check(identifier)
}
