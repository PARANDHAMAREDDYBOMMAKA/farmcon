import { Redis } from '@upstash/redis';

// Initialize Redis client for caching
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Cache configuration
const CACHE_TTL = {
  products: 300, // 5 minutes
  product: 600, // 10 minutes
  orders: 60, // 1 minute
  crops: 180, // 3 minutes
  users: 600, // 10 minutes
};

/**
 * Get cached data or fetch from database
 */
export async function getCached<T>(
  key: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  try {
    // Try to get from cache
    const cached = await redis.get<T>(key);

    if (cached !== null) {
      console.log(`[Cache HIT] ${key}`);
      return cached;
    }

    console.log(`[Cache MISS] ${key}`);

    // Fetch from database
    const data = await fetchFn();

    // Store in cache
    await redis.setex(key, ttl, JSON.stringify(data));

    return data;
  } catch (error) {
    console.error(`[Cache ERROR] ${key}:`, error);
    // If cache fails, just fetch from database
    return await fetchFn();
  }
}

/**
 * Invalidate cache for a specific key pattern
 */
export async function invalidateCache(pattern: string) {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => redis.del(key)));
      console.log(`[Cache INVALIDATED] ${pattern} (${keys.length} keys)`);
    }
  } catch (error) {
    console.error(`[Cache INVALIDATE ERROR] ${pattern}:`, error);
  }
}

/**
 * Generate cache keys
 */
export const cacheKeys = {
  products: (category?: string, supplierId?: string) => {
    let key = 'products';
    if (category) key += `:category:${category}`;
    if (supplierId) key += `:supplier:${supplierId}`;
    return key;
  },
  product: (id: string) => `product:${id}`,
  orders: (status?: string) => (status ? `orders:status:${status}` : 'orders:all'),
  crops: (farmerId?: string) => (farmerId ? `crops:farmer:${farmerId}` : 'crops:all'),
  users: () => 'users:all',
  user: (id: string) => `user:${id}`,
};

export { CACHE_TTL };
