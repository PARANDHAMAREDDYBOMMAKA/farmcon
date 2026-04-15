import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface ToolRequest {
  tool_name: string
  parameters?: {
    query?: string
    category?: string
    limit?: number
    page_context?: string
    user_id?: string
    commodity?: string
    state?: string
    district?: string
    location?: string
    status?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ToolRequest
    const { tool_name, parameters = {} } = body

    switch (tool_name) {
      case 'search_products':
        return searchIndex('products', parameters, (hit) => ({
          name: hit.name,
          description: hit.description,
          price: hit.price ? `₹${hit.price}` : 'N/A',
          category: hit.category,
          stock: hit.stock,
          status: hit.status,
        }))
      case 'search_crops':
        return searchIndex('crops', parameters, (hit) => ({
          name: hit.name,
          description: hit.description,
          status: hit.status,
          planting_date: hit.plantingDate,
          expected_harvest: hit.expectedHarvest,
          area: hit.area,
        }))
      case 'search_equipment':
        return searchIndex('equipment', parameters, (hit) => ({
          name: hit.name,
          description: hit.description,
          type: hit.type,
          hourly_rate: hit.hourlyRate ? `₹${hit.hourlyRate}/hr` : 'N/A',
          daily_rate: hit.dailyRate ? `₹${hit.dailyRate}/day` : 'N/A',
          status: hit.status,
        }))
      case 'get_weather':
        return await getWeather(parameters, request)
      case 'get_market_price':
        return await getMarketPrice(parameters, request)
      case 'get_user_orders':
        return await getUserOrders(parameters)
      case 'get_user_crops':
        return await getUserCrops(parameters)
      case 'get_user_profile':
        return await getUserProfile(parameters)
      case 'get_application_context':
        return getAppContext(parameters)
      default:
        return NextResponse.json({ error: `Unknown tool: ${tool_name}` }, { status: 400 })
    }
  } catch (error) {
    console.error('ElevenLabs tool error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

async function searchIndex(
  index: 'products' | 'crops' | 'equipment',
  params: ToolRequest['parameters'] = {},
  shape: (hit: any) => any,
) {
  try {
    const { search } = await import('@/lib/meilisearch')
    const query = params.query || ''
    const limit = Math.min(params.limit || 8, 20)
    const results = await search(index, query, { limit })
    const items = (results.hits || []).map(shape)
    return NextResponse.json({
      success: true,
      tool: `search_${index}`,
      data: { query, results_count: items.length, items },
      message:
        items.length > 0
          ? `Found ${items.length} ${index} matching "${query}".`
          : `No ${index} found for "${query}".`,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      tool: `search_${index}`,
      error: error instanceof Error ? error.message : 'Search failed',
      data: { items: [] },
    })
  }
}

async function getWeather(params: ToolRequest['parameters'] = {}, request: NextRequest) {
  const location = params.location || 'New Delhi, India'
  try {
    const res = await fetch(
      `${request.nextUrl.origin}/api/weather?location=${encodeURIComponent(location)}`,
    )
    const data = await res.json()
    if (!res.ok || !data.weather) {
      return NextResponse.json({
        success: false,
        tool: 'get_weather',
        error: data.error || 'Weather unavailable',
      })
    }
    const w = data.weather
    const summary = `${w.location}: currently ${w.temperature}°C, ${w.condition}. Humidity ${w.humidity}%, wind ${w.windSpeed} km/h. Next day ${w.forecast?.[1]?.high}°/${w.forecast?.[1]?.low}° ${w.forecast?.[1]?.condition || ''}.`
    return NextResponse.json({
      success: true,
      tool: 'get_weather',
      data: w,
      message: summary,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      tool: 'get_weather',
      error: error instanceof Error ? error.message : 'Weather fetch failed',
    })
  }
}

async function getMarketPrice(params: ToolRequest['parameters'] = {}, request: NextRequest) {
  const commodity = params.commodity || 'Rice'
  const state = params.state
  const district = params.district
  const url = new URL(`${request.nextUrl.origin}/api/market-prices`)
  url.searchParams.set('commodity', commodity)
  if (state) url.searchParams.set('state', state)
  if (district) url.searchParams.set('district', district)

  try {
    const res = await fetch(url.toString())
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({
        success: false,
        tool: 'get_market_price',
        error: data.error || 'No market data',
      })
    }
    const insights = data.insights || {}
    const topMarkets = (insights.bestMarkets || []).slice(0, 3)
    const summary = `${commodity}: average ₹${insights.avgPrice || 'N/A'}/quintal, range ₹${insights.priceRange?.min || 'N/A'}–₹${insights.priceRange?.max || 'N/A'}. Trend: ${insights.seasonalTrend || 'stable'}. Best markets: ${topMarkets.map((m: any) => `${m.market} (${m.state}) at ₹${m.price}`).join(', ') || 'N/A'}.`
    return NextResponse.json({
      success: true,
      tool: 'get_market_price',
      data: {
        commodity,
        avgPrice: insights.avgPrice,
        priceRange: insights.priceRange,
        trend: insights.seasonalTrend,
        recommendation: insights.recommendation,
        bestMarkets: topMarkets,
        topRecords: (data.prices || []).slice(0, 5),
      },
      message: summary,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      tool: 'get_market_price',
      error: error instanceof Error ? error.message : 'Market price fetch failed',
    })
  }
}

async function getUserOrders(params: ToolRequest['parameters'] = {}) {
  const userId = params.user_id
  if (!userId) {
    return NextResponse.json({
      success: false,
      tool: 'get_user_orders',
      error: 'user_id is required',
    })
  }
  try {
    const orders = await prisma.order.findMany({
      where: {
        OR: [{ customerId: userId }, { sellerId: userId }],
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
        customerId: true,
        sellerId: true,
      },
    })

    const summary =
      orders.length === 0
        ? 'No orders found yet.'
        : orders
            .slice(0, 5)
            .map(
              (o) =>
                `#${o.id.slice(-6)} • ${o.status} • ₹${o.totalAmount} • ${new Date(o.createdAt).toLocaleDateString('en-IN')}`,
            )
            .join('\n')

    return NextResponse.json({
      success: true,
      tool: 'get_user_orders',
      data: { orders, count: orders.length },
      message: summary,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      tool: 'get_user_orders',
      error: error instanceof Error ? error.message : 'Order fetch failed',
    })
  }
}

async function getUserCrops(params: ToolRequest['parameters'] = {}) {
  const userId = params.user_id
  if (!userId) {
    return NextResponse.json({
      success: false,
      tool: 'get_user_crops',
      error: 'user_id is required',
    })
  }
  try {
    const crops = await prisma.crop.findMany({
      where: { farmerId: userId },
      orderBy: { updatedAt: 'desc' },
      take: 10,
      select: {
        id: true,
        name: true,
        status: true,
        plantingDate: true,
        expectedHarvestDate: true,
      },
    })
    const summary =
      crops.length === 0
        ? 'No crops tracked yet.'
        : crops
            .map(
              (c) =>
                `${c.name} • ${c.status}${c.expectedHarvestDate ? ` • harvest ${new Date(c.expectedHarvestDate).toLocaleDateString('en-IN')}` : ''}`,
            )
            .join('\n')
    return NextResponse.json({
      success: true,
      tool: 'get_user_crops',
      data: { crops, count: crops.length },
      message: summary,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      tool: 'get_user_crops',
      error: error instanceof Error ? error.message : 'Crop fetch failed',
    })
  }
}

async function getUserProfile(params: ToolRequest['parameters'] = {}) {
  const userId = params.user_id
  if (!userId) {
    return NextResponse.json({
      success: false,
      tool: 'get_user_profile',
      error: 'user_id is required',
    })
  }
  try {
    const profile = await prisma.profile.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        city: true,
        state: true,
        phone: true,
      },
    })
    if (!profile) {
      return NextResponse.json({
        success: false,
        tool: 'get_user_profile',
        error: 'Profile not found',
      })
    }
    return NextResponse.json({
      success: true,
      tool: 'get_user_profile',
      data: profile,
      message: `User: ${profile.fullName} (${profile.role}) in ${profile.city || 'Unknown city'}, ${profile.state || ''}`,
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      tool: 'get_user_profile',
      error: error instanceof Error ? error.message : 'Profile fetch failed',
    })
  }
}

function getAppContext(params: ToolRequest['parameters'] = {}) {
  const context = params.page_context || '/'
  const pages: Record<string, { name: string; description: string; features: string[] }> = {
    '/dashboard': {
      name: 'Dashboard',
      description: 'Main control center',
      features: ['crops', 'orders', 'weather', 'market prices'],
    },
    '/dashboard/supplies': {
      name: 'Agricultural Supplies',
      description: 'Buy seeds, fertilizers, tools',
      features: ['search products', 'add to cart', 'place order'],
    },
    '/dashboard/crops': {
      name: 'Crops',
      description: 'Manage your crop lifecycle',
      features: ['add crop', 'track growth', 'harvest planning'],
    },
    '/dashboard/equipment': {
      name: 'Equipment rentals',
      description: 'Rent tractors and machinery',
      features: ['browse equipment', 'book rental'],
    },
    '/dashboard/orders': {
      name: 'Orders',
      description: 'Orders and deliveries',
      features: ['view orders', 'track delivery', 'download invoice'],
    },
    '/dashboard/weather': {
      name: 'Weather',
      description: 'Hyperlocal weather + farming advice',
      features: ['7-day forecast', 'irrigation advice', 'alerts'],
    },
    '/dashboard/market-prices': {
      name: 'Market prices',
      description: 'Live mandi prices',
      features: ['check price', 'compare markets', 'trend analysis'],
    },
  }

  const matched =
    Object.entries(pages).find(([key]) => context.startsWith(key))?.[1] || {
      name: 'FarmCon',
      description: 'Agricultural marketplace',
      features: ['crops', 'orders', 'weather', 'market prices'],
    }

  return NextResponse.json({
    success: true,
    tool: 'get_application_context',
    data: {
      current_page: matched.name,
      description: matched.description,
      features: matched.features,
      capabilities: [
        'Search products, crops, equipment',
        'Check weather for any Indian location',
        'Fetch live mandi prices',
        'Lookup user orders and crops',
      ],
    },
    message: `User is on ${matched.name}. ${matched.description}.`,
  })
}
