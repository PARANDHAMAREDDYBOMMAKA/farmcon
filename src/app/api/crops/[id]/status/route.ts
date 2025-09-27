import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'

// PUT /api/crops/[id]/status - Update crop status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()
    
    // Validate status
    const validStatuses = ['planted', 'growing', 'ready_to_harvest', 'harvested', 'sold']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    // Get current crop to check transition validity and get farmerId
    const currentCrop = await prisma.crop.findUnique({
      where: { id: params.id },
      select: { status: true, farmerId: true, actualHarvestDate: true }
    })

    if (!currentCrop) {
      return NextResponse.json({ error: 'Crop not found' }, { status: 404 })
    }

    // Update data based on status change
    const updateData: any = { status }

    // Set actual harvest date when moving to harvested status
    if (status === 'harvested' && !currentCrop.actualHarvestDate) {
      updateData.actualHarvestDate = new Date()
    }

    const crop = await prisma.crop.update({
      where: { id: params.id },
      data: updateData
    })

    // Invalidate cache
    await cache.del(CacheKeys.crop(params.id))
    await cache.del(CacheKeys.cropsList(currentCrop.farmerId))

    return NextResponse.json({ crop })
  } catch (error: any) {
    console.error('Crop status update error:', error)
    return NextResponse.json(
      { error: 'Failed to update crop status', details: error.message },
      { status: 500 }
    )
  }
}