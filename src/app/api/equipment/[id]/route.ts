import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteMultipleFromCloudinary } from '@/lib/cloudinary'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params

    if (!equipmentId) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      include: {
        owner: {
          select: {
            fullName: true,
            city: true,
            state: true,
            phone: true,
            email: true
          }
        }
      }
    })

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error('Error in equipment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params
    const body = await request.json()

    if (!equipmentId) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }

    const equipment = await prisma.equipment.update({
      where: { id: equipmentId },
      data: {
        name: body.name,
        category: body.category,
        brand: body.brand,
        model: body.model,
        yearManufactured: body.year_manufactured,
        description: body.description,
        images: body.images,
        hourlyRate: body.hourly_rate,
        dailyRate: body.daily_rate,
        status: body.status,
        location: body.location,
        specifications: body.specifications,
        updatedAt: new Date()
      },
      include: {
        owner: {
          select: {
            fullName: true,
            city: true,
            state: true,
            phone: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error('Error in equipment update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: equipmentId } = await params

    if (!equipmentId) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }

    const equipment = await prisma.equipment.findUnique({
      where: { id: equipmentId },
      select: { images: true }
    })

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    if (equipment.images && equipment.images.length > 0) {
      await deleteMultipleFromCloudinary(equipment.images)
    }

    await prisma.equipment.delete({
      where: { id: equipmentId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in equipment delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}