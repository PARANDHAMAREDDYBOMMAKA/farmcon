import { NextRequest, NextResponse } from 'next/server'
import { cache } from '@/lib/redis'

interface FilterParams {
  commodity?: string
  state?: string
  district?: string
  market?: string
  minPrice?: number
  maxPrice?: number
  dateFrom?: string
  dateTo?: string
  sortBy?: 'price-asc' | 'price-desc' | 'date-asc' | 'date-desc'
  page?: number
  limit?: number
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const filters: FilterParams = {
      commodity: searchParams.get('commodity') || undefined,
      state: searchParams.get('state') || undefined,
      district: searchParams.get('district') || undefined,
      market: searchParams.get('market') || undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      sortBy: (searchParams.get('sortBy') as any) || 'date-desc',
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    // Create cache key from filters
    const filterHash = JSON.stringify(filters)
    const cacheKey = `farmcon:filter:${Buffer.from(filterHash).toString('base64').slice(0, 32)}`

    // Check cache with multiple Redis operations
    const [cachedData, filterCount] = await Promise.all([
      cache.get(cacheKey),
      cache.incr('farmcon:stats:filter-requests', 86400)
    ])

    if (cachedData) {
      await Promise.all([
        cache.incr('farmcon:stats:filter-cache-hits', 86400),
        cache.zadd('farmcon:popular-filters', Date.now(), filters.commodity || 'all', 86400)
      ])
      return NextResponse.json({ ...cachedData, cached: true })
    }

    // Fetch from main market data cache or API
    let allPrices: any[] = []

    if (filters.commodity) {
      const mainCacheKey = `farmcon:market-data:${filters.commodity}${filters.state ? `:${filters.state}` : ''}${filters.district ? `:${filters.district}` : ''}`
      const mainData = await cache.get<any>(mainCacheKey)

      if (mainData && mainData.prices) {
        allPrices = mainData.prices
      } else {
        // Fetch fresh data
        const apiUrl = new URL('/api/market-prices', request.url)
        apiUrl.searchParams.set('commodity', filters.commodity)
        if (filters.state) apiUrl.searchParams.set('state', filters.state)
        if (filters.district) apiUrl.searchParams.set('district', filters.district)

        const response = await fetch(apiUrl.toString())
        const data = await response.json()
        allPrices = data.prices || []
      }
    }

    // Apply filters
    let filteredPrices = allPrices.filter(price => {
      if (filters.market && !price.market.toLowerCase().includes(filters.market.toLowerCase())) {
        return false
      }

      if (filters.minPrice && price.modalPrice < filters.minPrice) {
        return false
      }

      if (filters.maxPrice && price.modalPrice > filters.maxPrice) {
        return false
      }

      if (filters.dateFrom && new Date(price.date) < new Date(filters.dateFrom)) {
        return false
      }

      if (filters.dateTo && new Date(price.date) > new Date(filters.dateTo)) {
        return false
      }

      return true
    })

    // Apply sorting
    filteredPrices.sort((a, b) => {
      switch (filters.sortBy) {
        case 'price-asc':
          return a.modalPrice - b.modalPrice
        case 'price-desc':
          return b.modalPrice - a.modalPrice
        case 'date-asc':
          return new Date(a.date).getTime() - new Date(b.date).getTime()
        case 'date-desc':
        default:
          return new Date(b.date).getTime() - new Date(a.date).getTime()
      }
    })

    // Pagination
    const page = filters.page || 1
    const limit = filters.limit || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedPrices = filteredPrices.slice(startIndex, endIndex)

    const result = {
      prices: paginatedPrices,
      pagination: {
        page,
        limit,
        total: filteredPrices.length,
        totalPages: Math.ceil(filteredPrices.length / limit),
        hasNext: endIndex < filteredPrices.length,
        hasPrev: page > 1
      },
      filters,
      cached: false
    }

    // Cache result with multiple Redis operations
    await Promise.all([
      cache.set(cacheKey, result, 1800), // 30 min cache
      cache.incr('farmcon:stats:filter-cache-misses', 86400),
      cache.zadd('farmcon:popular-filters', Date.now(), filters.commodity || 'all', 86400),
      cache.set(`farmcon:last-filter:${filters.commodity}`, filters, 3600)
    ])

    return NextResponse.json(result)
  } catch (error) {
    console.error('Filter API error:', error)
    await cache.incr('farmcon:stats:filter-errors', 86400)
    return NextResponse.json(
      { error: 'Failed to filter market prices' },
      { status: 500 }
    )
  }
}
