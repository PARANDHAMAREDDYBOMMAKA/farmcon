import { Redis } from '@upstash/redis'

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

export interface CacheStats {
  hits: number
  misses: number
  hitRate: number
}

export class Cache {
  private redis: Redis | null
  private stats = { hits: 0, misses: 0 }

  constructor() {
    this.redis = redis
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null

    try {
      const value = await this.redis.get(key)
      if (value !== null) {
        this.stats.hits++
      } else {
        this.stats.misses++
      }
      return value as T | null
    } catch (error) {
      console.warn('Cache get error:', error)
      this.stats.misses++
      return null
    }
  }

  async set(key: string, value: any, ttlSeconds = 300): Promise<boolean> {
    if (!this.redis) return false

    try {
      if (ttlSeconds > 0) {
        await this.redis.setex(key, ttlSeconds, value)
      } else {
        await this.redis.set(key, value)
      }
      return true
    } catch (error) {
      console.warn('Cache set error:', error)
      return false
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      console.warn('Cache delete error:', error)
      return false
    }
  }

  async invalidatePattern(pattern: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      const keys = await this.redis.keys(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      console.warn('Cache invalidate pattern error:', error)
      return false
    }
  }

  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.redis || keys.length === 0) return []

    try {
      const values = await this.redis.mget(...keys)
      return values.map(v => v as T | null)
    } catch (error) {
      console.warn('Cache mget error:', error)
      return keys.map(() => null)
    }
  }

  async mset(entries: Array<{ key: string; value: any; ttl?: number }>): Promise<boolean> {
    if (!this.redis || entries.length === 0) return false

    try {
      
      const withoutTTL = entries.filter(e => !e.ttl || e.ttl <= 0)
      const withTTL = entries.filter(e => e.ttl && e.ttl > 0)

      if (withoutTTL.length > 0) {
        const kvPairs: Record<string, any> = {}
        for (const entry of withoutTTL) {
          kvPairs[entry.key] = entry.value
        }
        await this.redis.mset(kvPairs)
      }

      for (const entry of withTTL) {
        await this.redis.setex(entry.key, entry.ttl!, entry.value)
      }

      return true
    } catch (error) {
      console.warn('Cache mset error:', error)
      return false
    }
  }

  async getOrSet<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttlSeconds = 300
  ): Promise<T | null> {
    
    const cached = await this.get<T>(key)
    if (cached !== null) return cached

    try {
      const value = await fetcher()
      if (value !== null && value !== undefined) {
        await this.set(key, value, ttlSeconds)
      }
      return value
    } catch (error) {
      console.error('Cache getOrSet fetcher error:', error)
      return null
    }
  }

  async incr(key: string, ttlSeconds?: number): Promise<number> {
    if (!this.redis) return 0

    try {
      const value = await this.redis.incr(key)
      if (ttlSeconds && value === 1) {
        
        await this.redis.expire(key, ttlSeconds)
      }
      return value
    } catch (error) {
      console.warn('Cache incr error:', error)
      return 0
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.redis) return -1

    try {
      return await this.redis.ttl(key)
    } catch (error) {
      console.warn('Cache TTL error:', error)
      return -1
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redis) return false

    try {
      const result = await this.redis.exists(key)
      return result > 0
    } catch (error) {
      console.warn('Cache exists error:', error)
      return false
    }
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses
    return {
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: total > 0 ? (this.stats.hits / total) * 100 : 0
    }
  }

  resetStats(): void {
    this.stats = { hits: 0, misses: 0 }
  }

  static key(prefix: string, id: string): string {
    return `farmcon:${prefix}:${id}`
  }

  static listKey(prefix: string, userId: string): string {
    return `farmcon:${prefix}:list:${userId}`
  }
}

export const cache = new Cache()

export const CacheKeys = {
  crop: (id: string) => Cache.key('crop', id),
  cropsList: (farmerId: string) => Cache.listKey('crops', farmerId),
  profile: (id: string) => Cache.key('profile', id),
  farmerProfile: (id: string) => Cache.key('farmer', id),
  dashboardStats: (userId: string, role: string) => Cache.key('stats', `${userId}:${role}`),
  marketPrices: (location?: string) => location ? Cache.key('prices', location) : 'farmcon:prices:all',
  products: (supplierId?: string, category?: string) => Cache.key('products', `${supplierId || 'all'}:${category || 'all'}`),
  product: (id: string) => Cache.key('product', id),
  productsList: (supplierId: string) => Cache.listKey('products', supplierId),
  orders: (userId: string, type: string) => Cache.key('orders', `${userId}:${type}`),
  order: (id: string) => Cache.key('order', id),
  cart: (userId: string) => Cache.key('cart', userId),
  equipment: (id: string) => Cache.key('equipment', id),
  equipmentList: (ownerId?: string) => Cache.key('equipment', `list:${ownerId || 'all'}`),
  categories: () => 'farmcon:categories:all',
  suppliers: () => 'farmcon:suppliers:all',
} as const

export default redis