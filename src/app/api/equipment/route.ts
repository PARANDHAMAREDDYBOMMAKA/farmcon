import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'

// GET /api/equipment - Get equipment
export async function GET(request: NextRequest) {
  try {

    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get('ownerId')

    // Try to get from cache first
    const cacheKey = CacheKeys.equipmentList(ownerId || undefined)
    const cached = await cache.get(cacheKey)

    if (cached) {
      return NextResponse.json({ equipment: cached })
    }

    const whereClause = ownerId ? { ownerId } : {}

    const equipment = await prisma.equipment.findMany({
      where: whereClause,
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            city: true,
            state: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Cache for 5 minutes
    await cache.set(cacheKey, equipment, 300)

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error('Equipment fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch equipment' },
      { status: 500 }
    )
  }
}

// POST /api/equipment - Create new equipment
export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json()
    
    const {
      owner_id,
      name,
      category,
      brand,
      model,
      year_manufactured,
      description,
      images,
      hourly_rate,
      daily_rate,
      status,
      location,
      specifications
    } = body

    // Validate required fields
    if (!owner_id || !name || !category) {
      return NextResponse.json(
        { error: 'Owner ID, name, and category are required' },
        { status: 400 }
      )
    }

    // Create equipment using Prisma
    const equipment = await prisma.equipment.create({
      data: {
        ownerId: owner_id,
        name,
        category,
        brand,
        model,
        yearManufactured: year_manufactured,
        description,
        images: images || [],
        hourlyRate: hourly_rate ? parseFloat(hourly_rate) : null,
        dailyRate: daily_rate ? parseFloat(daily_rate) : null,
        status: status || 'available',
        location,
        specifications
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            city: true,
            state: true,
            phone: true
          }
        }
      }
    })

    // Invalidate equipment caches
    await cache.invalidatePattern('farmcon:equipment:*')

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error('Equipment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create equipment' },
      { status: 500 }
    )
  }
}