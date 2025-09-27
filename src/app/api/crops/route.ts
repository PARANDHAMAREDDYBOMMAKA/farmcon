import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'

// GET /api/crops - Get crops for a farmer
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')

    if (!farmerId) {
      return NextResponse.json({ error: 'Farmer ID is required' }, { status: 400 })
    }

    // Try to get from cache first
    const cacheKey = CacheKeys.cropsList(farmerId)
    const cached = await cache.get(cacheKey)
    
    if (cached) {
      return NextResponse.json({ crops: cached })
    }

    const crops = await prisma.crop.findMany({
      where: { farmerId },
      orderBy: { createdAt: 'desc' }
    })

    // Cache for 5 minutes
    await cache.set(cacheKey, crops, 300)
    
    return NextResponse.json({ crops })
  } catch (error: any) {
    console.error('Crops fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crops', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/crops - Create a new crop
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Convert date strings to Date objects for Prisma
    const cropData = {
      ...body,
      plantedDate: body.plantedDate ? new Date(body.plantedDate) : null,
      expectedHarvestDate: body.expectedHarvestDate ? new Date(body.expectedHarvestDate) : null,
      actualHarvestDate: body.actualHarvestDate ? new Date(body.actualHarvestDate) : null,
    }
    
    const crop = await prisma.crop.create({
      data: cropData
    })

    // Invalidate farmer's crops cache
    await cache.del(CacheKeys.cropsList(body.farmerId))
    
    return NextResponse.json({ crop })
  } catch (error: any) {
    console.error('Crop creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create crop', details: error.message },
      { status: 500 }
    )
  }
}