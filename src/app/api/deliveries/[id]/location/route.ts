import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST update driver location for delivery
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliveryId } = await params
    const body = await request.json()

    const { latitude, longitude, accuracy, speed, heading, address } = body

    if (!latitude || !longitude) {
      return NextResponse.json(
        { error: 'Latitude and longitude are required' },
        { status: 400 }
      )
    }

    // Create location history record
    const locationRecord = await prisma.deliveryLocation.create({
      data: {
        deliveryId,
        latitude,
        longitude,
        accuracy,
        speed,
        heading,
        address,
        timestamp: new Date()
      }
    })

    // Update driver's current location if driver is assigned
    const delivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { driverId: true }
    })

    if (delivery?.driverId) {
      await prisma.driver.update({
        where: { id: delivery.driverId },
        data: {
          currentLatitude: latitude,
          currentLongitude: longitude,
          lastLocationUpdate: new Date()
        }
      })
    }

    // Update delivery status to in_transit if still assigned or picked_up
    const currentDelivery = await prisma.delivery.findUnique({
      where: { id: deliveryId },
      select: { status: true }
    })

    if (currentDelivery && ['assigned', 'picked_up'].includes(currentDelivery.status)) {
      await prisma.delivery.update({
        where: { id: deliveryId },
        data: { status: 'in_transit' }
      })
    }

    return NextResponse.json({
      success: true,
      location: locationRecord
    })
  } catch (error) {
    console.error('Error updating delivery location:', error)
    return NextResponse.json({ error: 'Failed to update location' }, { status: 500 })
  }
}

// GET location history for delivery
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliveryId } = await params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const since = searchParams.get('since') // ISO timestamp

    const where: any = { deliveryId }
    if (since) {
      where.timestamp = {
        gte: new Date(since)
      }
    }

    const locations = await prisma.deliveryLocation.findMany({
      where,
      orderBy: {
        timestamp: 'desc'
      },
      take: limit
    })

    return NextResponse.json({ locations })
  } catch (error) {
    console.error('Error fetching location history:', error)
    return NextResponse.json({ error: 'Failed to fetch location history' }, { status: 500 })
  }
}
