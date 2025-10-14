import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json()

    const validStatuses = ['planted', 'growing', 'ready_to_harvest', 'harvested', 'sold']
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const currentCrop = await prisma.crop.findUnique({
      where: { id: params.id },
      select: { status: true, farmerId: true, actualHarvestDate: true }
    })

    if (!currentCrop) {
      return NextResponse.json({ error: 'Crop not found' }, { status: 404 })
    }

    const updateData: any = { status }

    if (status === 'harvested' && !currentCrop.actualHarvestDate) {
      updateData.actualHarvestDate = new Date()
    }

    const crop = await prisma.crop.update({
      where: { id: params.id },
      data: updateData
    })

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