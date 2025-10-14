import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'
import { deleteMultipleFromCloudinary } from '@/lib/cloudinary'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const cacheKey = CacheKeys.crop(params.id)
    const cached = await cache.get(cacheKey)
    
    if (cached) {
      return NextResponse.json({ crop: cached })
    }

    const crop = await prisma.crop.findUnique({
      where: { id: params.id },
      include: {
        farmer: {
          select: {
            fullName: true,
            email: true,
            phone: true,
            city: true,
            state: true,
          }
        },
        listings: {
          where: { isActive: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    })

    if (!crop) {
      return NextResponse.json({ error: 'Crop not found' }, { status: 404 })
    }

    await cache.set(cacheKey, crop, 600)

    return NextResponse.json({ crop })
  } catch (error: any) {
    console.error('Crop fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crop', details: error.message },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const cropData = {
      ...body,
      plantedDate: body.plantedDate ? new Date(body.plantedDate) : null,
      expectedHarvestDate: body.expectedHarvestDate ? new Date(body.expectedHarvestDate) : null,
      actualHarvestDate: body.actualHarvestDate ? new Date(body.actualHarvestDate) : null,
    }

    const crop = await prisma.crop.update({
      where: { id: params.id },
      data: cropData
    })

    await cache.del(CacheKeys.crop(params.id))
    if (body.farmerId) {
      await cache.del(CacheKeys.cropsList(body.farmerId))
    }

    return NextResponse.json({ crop })
  } catch (error: any) {
    console.error('Crop update error:', error)
    return NextResponse.json(
      { error: 'Failed to update crop', details: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const crop = await prisma.crop.findUnique({
      where: { id: params.id },
      select: { farmerId: true, images: true }
    })

    if (!crop) {
      return NextResponse.json({ error: 'Crop not found' }, { status: 404 })
    }

    if (crop.images && crop.images.length > 0) {
      await deleteMultipleFromCloudinary(crop.images)
    }

    await prisma.crop.delete({
      where: { id: params.id }
    })

    await cache.del(CacheKeys.crop(params.id))
    await cache.del(CacheKeys.cropsList(crop.farmerId))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Crop deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete crop', details: error.message },
      { status: 500 }
    )
  }
}