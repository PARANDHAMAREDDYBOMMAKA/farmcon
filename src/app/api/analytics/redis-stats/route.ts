import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    // Batch fetch all stats using mget for efficiency
    const statKeys = [
      'farmcon:stats:cache-hits',
      'farmcon:stats:cache-misses',
      'farmcon:stats:filter-requests',
      'farmcon:stats:filter-cache-hits',
      'farmcon:stats:filter-cache-misses',
      'farmcon:stats:weather-cache-hits',
      'farmcon:stats:weather-cache-misses',
      'farmcon:stats:weather-api-errors',
      'farmcon:stats:total-weather-requests',
      'farmcon:stats:api-errors'
    ]

    const statsValues = await cache.mget<number>(statKeys)

    // Get popular commodities and locations
    const [popularCommodities, popularLocations] = await Promise.all([
      cache.zrange('farmcon:popular-commodities', 0, 9),
      cache.zrange('farmcon:popular-locations', 0, 9)
    ])

    // Get market stats
    const marketStats = await cache.hgetall('farmcon:market-stats')

    // Calculate derived metrics
    const totalCacheHits = (statsValues[0] || 0) + (statsValues[3] || 0) + (statsValues[5] || 0)
    const totalCacheMisses = (statsValues[1] || 0) + (statsValues[4] || 0) + (statsValues[6] || 0)
    const totalRequests = totalCacheHits + totalCacheMisses
    const cacheHitRate = totalRequests > 0 ? ((totalCacheHits / totalRequests) * 100).toFixed(2) : '0'

    const stats = {
      cache: {
        marketDataCacheHits: statsValues[0] || 0,
        marketDataCacheMisses: statsValues[1] || 0,
        filterCacheHits: statsValues[3] || 0,
        filterCacheMisses: statsValues[4] || 0,
        weatherCacheHits: statsValues[5] || 0,
        weatherCacheMisses: statsValues[6] || 0,
        totalCacheHits,
        totalCacheMisses,
        cacheHitRate: `${cacheHitRate}%`,
        totalRequests
      },
      requests: {
        filterRequests: statsValues[2] || 0,
        weatherRequests: statsValues[8] || 0,
        totalApiErrors: statsValues[9] || 0,
        weatherApiErrors: statsValues[7] || 0
      },
      popular: {
        commodities: popularCommodities || [],
        locations: popularLocations || []
      },
      marketStats: marketStats || {},
      redisOperations: {
        estimatedDailyOperations: totalRequests * 7, // Each request does ~7 Redis ops
        storageKeys: [
          'Market data cache',
          'Filter cache',
          'Weather cache',
          'Analytics counters',
          'Popular commodities (sorted set)',
          'Popular locations (sorted set)',
          'Market stats (hash)',
          'Current weather (hash)',
          'Farming advice cache',
          'Price records cache',
          'Latest queries cache',
          'Price ranges cache'
        ]
      },
      timestamp: new Date().toISOString()
    }

    // Increment analytics view counter
    await Promise.all([
      cache.incr('farmcon:stats:analytics-views', 86400),
      cache.set('farmcon:last-analytics-check', Date.now(), 3600)
    ])

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    )
  }
}
