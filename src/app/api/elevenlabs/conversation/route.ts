import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

interface ConversationRequest {
  query: string
  context?: string
  user_id?: string
  session_id?: string
}

export async function POST(request: NextRequest) {
  try {
    const { query, context, user_id } = (await request.json()) as ConversationRequest

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 })
    }

    const [retrievedContext, userSnapshot] = await Promise.all([
      getRelevantContext(query, context).catch(() => ''),
      user_id ? getUserSnapshot(user_id).catch(() => null) : Promise.resolve(null),
    ])

    return NextResponse.json({
      success: true,
      query,
      context: context || '/',
      page_info: getPageInfo(context),
      user: userSnapshot,
      relevant_data: retrievedContext,
      suggestions: getSuggestions(context, userSnapshot?.role),
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('ElevenLabs conversation error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 },
    )
  }
}

async function getUserSnapshot(userId: string) {
  const profile = await prisma.profile.findUnique({
    where: { id: userId },
    select: {
      id: true,
      fullName: true,
      role: true,
      city: true,
      state: true,
      email: true,
    },
  })
  if (!profile) return null

  const [pendingOrders, activeCrops] = await Promise.all([
    prisma.order
      .count({
        where: {
          OR: [{ customerId: userId }, { sellerId: userId }],
          status: { in: ['pending', 'confirmed', 'shipped'] as any },
        },
      })
      .catch(() => 0),
    profile.role === 'farmer'
      ? prisma.crop
          .count({
            where: {
              farmerId: userId,
              status: { notIn: ['harvested', 'sold'] as any },
            },
          })
          .catch(() => 0)
      : Promise.resolve(0),
  ])

  return {
    id: profile.id,
    name: profile.fullName,
    role: profile.role,
    city: profile.city,
    state: profile.state,
    pending_orders: pendingOrders,
    active_crops: activeCrops,
  }
}

async function getRelevantContext(userQuery: string, context?: string): Promise<string> {
  if (!process.env.MEILISEARCH_HOST || !process.env.MEILISEARCH_API_KEY) {
    return ''
  }
  try {
    const { search } = await import('@/lib/meilisearch')
    let indexName: 'products' | 'crops' | 'equipment' = 'products'
    if (context?.includes('crops')) indexName = 'crops'
    else if (context?.includes('equipment')) indexName = 'equipment'

    const results = await search(indexName, userQuery, { limit: 5 })
    if (!results.hits?.length) return 'No matching records in the database.'

    return results.hits
      .map((h: any, i: number) => {
        const bits = [`${i + 1}. ${h.name}`]
        if (h.description) bits.push(h.description.slice(0, 140))
        if (h.price) bits.push(`Price: ₹${h.price}`)
        if (h.hourlyRate) bits.push(`₹${h.hourlyRate}/hr`)
        if (h.dailyRate) bits.push(`₹${h.dailyRate}/day`)
        if (h.status) bits.push(`Status: ${h.status}`)
        return bits.join(' · ')
      })
      .join('\n')
  } catch (err) {
    console.error('Context retrieval error:', err)
    return ''
  }
}

function getPageInfo(context?: string) {
  if (!context) return { name: 'Home', description: 'FarmCon landing page' }

  const map: Array<[string, { name: string; description: string; actions: string[] }]> = [
    [
      '/dashboard/supplies',
      {
        name: 'Agricultural Supplies',
        description: 'Seeds, fertilizers, pesticides, tools',
        actions: ['search products', 'view details', 'add to cart', 'checkout'],
      },
    ],
    [
      '/dashboard/crops',
      {
        name: 'Crop Management',
        description: 'Track crops, planting and harvest',
        actions: ['view crops', 'add crop', 'track growth', 'harvest planning'],
      },
    ],
    [
      '/dashboard/equipment',
      {
        name: 'Equipment Rental',
        description: 'Tractors, harvesters, machinery',
        actions: ['browse equipment', 'check availability', 'book rental'],
      },
    ],
    [
      '/dashboard/market-prices',
      {
        name: 'Market Prices',
        description: 'Live mandi prices and trends',
        actions: ['check prices', 'compare markets', 'price trends'],
      },
    ],
    [
      '/dashboard/orders',
      {
        name: 'Orders',
        description: 'Order management and tracking',
        actions: ['view orders', 'track delivery', 'download invoice'],
      },
    ],
    [
      '/dashboard/weather',
      {
        name: 'Weather',
        description: 'Forecast and farming recommendations',
        actions: ['view forecast', 'get advice', 'irrigation planning'],
      },
    ],
    [
      '/dashboard',
      {
        name: 'Dashboard',
        description: 'Main control center',
        actions: ['navigate features', 'view overview'],
      },
    ],
  ]
  const match = map.find(([k]) => context.startsWith(k))
  return match?.[1] || { name: 'FarmCon', description: 'Agricultural platform', actions: [] }
}

function getSuggestions(context: string | undefined, role?: string | null): string[] {
  const base: Record<string, string[]> = {
    supplies: [
      'Search for seeds for the current season',
      'Find organic fertilizers',
      'Compare pesticide prices',
    ],
    crops: ['Add a new crop', 'Check harvest predictions', 'View crop health status'],
    equipment: ['Find available tractors', 'Compare rental rates', 'Book harvester'],
    'market-prices': ['Check today’s price of tomato', 'Best market for onion', 'Wheat trend'],
    orders: ['Track my latest order', 'Any pending deliveries?', 'Download last invoice'],
    weather: ['Will it rain tomorrow?', 'Irrigation advice', 'Frost risk this week?'],
  }

  const key = Object.keys(base).find((k) => context?.includes(k))
  if (key) return base[key]

  if (role === 'farmer') {
    return ['What is the best selling market for my crop?', 'Weather for my farm', 'My pending orders']
  }
  if (role === 'supplier') {
    return ['Show my pending orders', 'Which products are low in stock?', 'Today’s order volume']
  }
  return ['Browse fresh produce', 'Check today’s mandi prices', 'Weather in my city']
}
