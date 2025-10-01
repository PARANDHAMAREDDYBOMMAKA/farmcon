import { Redis } from '@upstash/redis'

const redis = process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null

export class Cache {
  private redis: Redis | null

  constructor() {
    this.redis = redis
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.redis) return null

    try {
      const value = await this.redis.get(key)
      return value as T | null
    } catch (error) {
      console.warn('Cache get error:', error)
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

  // Helper method to generate cache keys
  static key(prefix: string, id: string): string {
    return `farmcon:${prefix}:${id}`
  }

  static listKey(prefix: string, userId: string): string {
    return `farmcon:${prefix}:list:${userId}`
  }
}

// Export a singleton instance
export const cache = new Cache()

// Cache key generators
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