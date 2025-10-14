import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            customer: {
              select: {
                fullName: true,
                phone: true,
                email: true
              }
            },
            seller: {
              select: {
                fullName: true,
                phone: true,
                email: true,
                address: true,
                city: true,
                state: true
              }
            },
            items: {
              include: {
                product: {
                  select: {
                    name: true,
                    images: true
                  }
                },
                cropListing: {
                  include: {
                    crop: {
                      select: {
                        name: true
                      }
                    }
                  }
                }
              }
            }
          }
        },
        driver: {
          select: {
            id: true,
            fullName: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
            currentLatitude: true,
            currentLongitude: true,
            lastLocationUpdate: true
          }
        },
        locationHistory: {
          orderBy: {
            timestamp: 'desc'
          },
          take: 100
        },
        milestones: {
          orderBy: {
            completedAt: 'asc'
          }
        }
      }
    })

    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }

    return NextResponse.json({ delivery })
  } catch (error) {
    console.error('Error fetching delivery:', error)
    return NextResponse.json({ error: 'Failed to fetch delivery' }, { status: 500 })
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
      driverId,
      status,
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      deliveryLatitude,
      deliveryLongitude,
      deliveryAddress,
      estimatedPickupTime,
      actualPickupTime,
      estimatedDeliveryTime,
      actualDeliveryTime,
      distance,
      notes
    } = body

    const updateData: any = {
      updatedAt: new Date()
    }

    if (driverId !== undefined) updateData.driverId = driverId
    if (status) updateData.status = status
    if (pickupLatitude !== undefined) updateData.pickupLatitude = pickupLatitude
    if (pickupLongitude !== undefined) updateData.pickupLongitude = pickupLongitude
    if (pickupAddress) updateData.pickupAddress = pickupAddress
    if (deliveryLatitude !== undefined) updateData.deliveryLatitude = deliveryLatitude
    if (deliveryLongitude !== undefined) updateData.deliveryLongitude = deliveryLongitude
    if (deliveryAddress) updateData.deliveryAddress = deliveryAddress
    if (estimatedPickupTime) updateData.estimatedPickupTime = new Date(estimatedPickupTime)
    if (actualPickupTime) updateData.actualPickupTime = new Date(actualPickupTime)
    if (estimatedDeliveryTime) updateData.estimatedDeliveryTime = new Date(estimatedDeliveryTime)
    if (actualDeliveryTime) updateData.actualDeliveryTime = new Date(actualDeliveryTime)
    if (distance !== undefined) updateData.distance = distance
    if (notes !== undefined) updateData.notes = notes

    const delivery = await prisma.delivery.update({
      where: { id },
      data: updateData,
      include: {
        order: true,
        driver: true,
        milestones: {
          orderBy: {
            completedAt: 'desc'
          }
        }
      }
    })

    if (status) {
      const milestoneDescriptions: any = {
        assigned: 'Driver assigned to delivery',
        picked_up: 'Package picked up from sender',
        in_transit: 'Package is in transit',
        out_for_delivery: 'Out for delivery',
        delivered: 'Package delivered successfully',
        cancelled: 'Delivery cancelled',
        failed: 'Delivery failed'
      }

      await prisma.deliveryMilestone.create({
        data: {
          deliveryId: delivery.id,
          milestone: status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
          description: milestoneDescriptions[status] || `Status changed to ${status}`,
          latitude: delivery.driver?.currentLatitude || null,
          longitude: delivery.driver?.currentLongitude || null
        }
      })
    }

    return NextResponse.json({ delivery })
  } catch (error) {
    console.error('Error updating delivery:', error)
    return NextResponse.json({ error: 'Failed to update delivery' }, { status: 500 })
  }
}
