import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const driver = await prisma.driver.findUnique({
      where: { id },
      include: {
        deliveries: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
                customer: {
                  select: {
                    fullName: true
                  }
                }
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        _count: {
          select: {
            deliveries: true
          }
        }
      }
    })

    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }

    return NextResponse.json({ driver })
  } catch (error) {
    console.error('Error fetching driver:', error)
    return NextResponse.json({ error: 'Failed to fetch driver' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const {
      fullName,
      phone,
      email,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      profileImageUrl,
      isActive,
      currentLatitude,
      currentLongitude
    } = body

    const updateData: any = {}

    if (fullName) updateData.fullName = fullName
    if (phone) updateData.phone = phone
    if (email !== undefined) updateData.email = email
    if (vehicleType) updateData.vehicleType = vehicleType
    if (vehicleNumber) updateData.vehicleNumber = vehicleNumber
    if (licenseNumber) updateData.licenseNumber = licenseNumber
    if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl
    if (isActive !== undefined) updateData.isActive = isActive
    if (currentLatitude !== undefined) {
      updateData.currentLatitude = currentLatitude
      updateData.lastLocationUpdate = new Date()
    }
    if (currentLongitude !== undefined) {
      updateData.currentLongitude = currentLongitude
      if (!updateData.lastLocationUpdate) {
        updateData.lastLocationUpdate = new Date()
      }
    }

    const driver = await prisma.driver.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({ driver })
  } catch (error) {
    console.error('Error updating driver:', error)
    return NextResponse.json({ error: 'Failed to update driver' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const activeDeliveries = await prisma.delivery.count({
      where: {
        driverId: id,
        status: {
          in: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery']
        }
      }
    })

    if (activeDeliveries > 0) {
      return NextResponse.json(
        { error: 'Cannot delete driver with active deliveries' },
        { status: 400 }
      )
    }

    await prisma.driver.delete({
      where: { id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting driver:', error)
    return NextResponse.json({ error: 'Failed to delete driver' }, { status: 500 })
  }
}
