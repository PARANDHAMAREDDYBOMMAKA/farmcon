import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET all drivers
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('isActive')

    const where: any = {}
    if (isActive !== null) {
      where.isActive = isActive === 'true'
    }

    const drivers = await prisma.driver.findMany({
      where,
      include: {
        deliveries: {
          where: {
            status: {
              in: ['assigned', 'picked_up', 'in_transit', 'out_for_delivery']
            }
          },
          include: {
            order: {
              select: {
                id: true,
                status: true
              }
            }
          }
        },
        _count: {
          select: {
            deliveries: true
          }
        }
      },
      orderBy: {
        fullName: 'asc'
      }
    })

    return NextResponse.json({ drivers })
  } catch (error) {
    console.error('Error fetching drivers:', error)
    return NextResponse.json({ error: 'Failed to fetch drivers' }, { status: 500 })
  }
}

// POST create driver
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      fullName,
      phone,
      email,
      vehicleType,
      vehicleNumber,
      licenseNumber,
      profileImageUrl
    } = body

    if (!fullName || !phone || !vehicleType || !vehicleNumber || !licenseNumber) {
      return NextResponse.json(
        { error: 'Full name, phone, vehicle type, vehicle number, and license number are required' },
        { status: 400 }
      )
    }

    // Check if driver with phone already exists
    const existingDriver = await prisma.driver.findUnique({
      where: { phone }
    })

    if (existingDriver) {
      return NextResponse.json(
        { error: 'Driver with this phone number already exists' },
        { status: 400 }
      )
    }

    const driver = await prisma.driver.create({
      data: {
        fullName,
        phone,
        email,
        vehicleType,
        vehicleNumber,
        licenseNumber,
        profileImageUrl,
        isActive: true
      }
    })

    return NextResponse.json({ driver }, { status: 201 })
  } catch (error) {
    console.error('Error creating driver:', error)
    return NextResponse.json({ error: 'Failed to create driver' }, { status: 500 })
  }
}
