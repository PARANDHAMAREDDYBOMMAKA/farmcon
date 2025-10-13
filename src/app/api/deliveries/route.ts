import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all deliveries
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const orderId = searchParams.get('orderId')
    const driverId = searchParams.get('driverId')
    const status = searchParams.get('status')

    const where: any = {}
    if (orderId) where.orderId = orderId
    if (driverId) where.driverId = driverId
    if (status) where.status = status

    const deliveries = await prisma.delivery.findMany({
      where,
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
          take: 50
        },
        milestones: {
          orderBy: {
            completedAt: 'desc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({ deliveries })
  } catch (error) {
    console.error('Error fetching deliveries:', error)
    return NextResponse.json({ error: 'Failed to fetch deliveries' }, { status: 500 })
  }
}

// POST create delivery
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId,
      driverId,
      pickupLatitude,
      pickupLongitude,
      pickupAddress,
      deliveryLatitude,
      deliveryLongitude,
      deliveryAddress,
      estimatedPickupTime,
      estimatedDeliveryTime,
      distance,
      notes
    } = body

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Check if delivery already exists for this order
    const existingDelivery = await prisma.delivery.findUnique({
      where: { orderId }
    })

    if (existingDelivery) {
      return NextResponse.json({ error: 'Delivery already exists for this order' }, { status: 400 })
    }

    // Generate tracking number
    const trackingNumber = `FCD${Date.now()}${Math.random().toString(36).substring(2, 7).toUpperCase()}`

    const delivery = await prisma.delivery.create({
      data: {
        orderId,
        driverId: driverId || null,
        status: driverId ? 'assigned' : 'pending',
        pickupLatitude,
        pickupLongitude,
        pickupAddress,
        deliveryLatitude,
        deliveryLongitude,
        deliveryAddress,
        estimatedPickupTime: estimatedPickupTime ? new Date(estimatedPickupTime) : null,
        estimatedDeliveryTime: estimatedDeliveryTime ? new Date(estimatedDeliveryTime) : null,
        distance,
        trackingNumber,
        notes
      },
      include: {
        order: true,
        driver: true
      }
    })

    // Create initial milestone
    await prisma.deliveryMilestone.create({
      data: {
        deliveryId: delivery.id,
        milestone: 'Delivery Created',
        description: 'Delivery tracking has been initiated',
        latitude: pickupLatitude,
        longitude: pickupLongitude
      }
    })

    return NextResponse.json({ delivery }, { status: 201 })
  } catch (error) {
    console.error('Error creating delivery:', error)
    return NextResponse.json({ error: 'Failed to create delivery' }, { status: 500 })
  }
}
