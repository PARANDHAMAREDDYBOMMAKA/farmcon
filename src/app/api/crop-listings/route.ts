import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const farmerId = searchParams.get('farmerId')
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    const isActive = searchParams.get('isActive')

    const whereClause: any = {}

    if (farmerId) {
      whereClause.farmerId = farmerId
    }

    if (search) {
      whereClause.OR = [
        { crop: { name: { contains: search, mode: 'insensitive' } } },
        { description: { contains: search, mode: 'insensitive' } },
        { pickupLocation: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (isActive !== null) {
      whereClause.isActive = isActive === 'true'
    }

    if (!farmerId) {
      whereClause.crop = {
        status: {
          not: 'sold'
        }
      }
    }

    const cropListings = await prisma.cropListing.findMany({
      where: whereClause,
      include: {
        crop: true,
        farmer: {
          select: {
            id: true,
            fullName: true,
            city: true,
            state: true,
            phone: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      ...(limit && { take: parseInt(limit) }),
      ...(offset && { skip: parseInt(offset) })
    })

    return NextResponse.json({ cropListings })
  } catch (error) {
    console.error('Crop listings fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crop listings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      cropId,
      farmerId,
      quantityAvailable,
      pricePerUnit,
      unit,
      harvestDate,
      expiryDate,
      deliveryAvailable,
      pickupLocation,
      images,
      description
    } = body

    if (!cropId || !farmerId || !quantityAvailable || !pricePerUnit || !unit) {
      return NextResponse.json(
        { error: 'Crop ID, farmer ID, quantity, price per unit, and unit are required' },
        { status: 400 }
      )
    }

    const cropListing = await prisma.cropListing.create({
      data: {
        cropId,
        farmerId,
        quantityAvailable: parseFloat(quantityAvailable.toString()),
        pricePerUnit: parseFloat(pricePerUnit.toString()),
        unit,
        harvestDate: harvestDate ? new Date(harvestDate) : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        deliveryAvailable: Boolean(deliveryAvailable),
        pickupLocation,
        images: images || [],
        description
      },
      include: {
        crop: true,
        farmer: {
          select: {
            id: true,
            fullName: true,
            city: true,
            state: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json({ cropListing })
  } catch (error) {
    console.error('Crop listing creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create crop listing' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Crop listing ID is required' },
        { status: 400 }
      )
    }

    if (updateData.harvestDate) {
      updateData.harvestDate = new Date(updateData.harvestDate)
    }
    if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate)
    }

    if (updateData.quantityAvailable) {
      updateData.quantityAvailable = parseFloat(updateData.quantityAvailable.toString())
    }
    if (updateData.pricePerUnit) {
      updateData.pricePerUnit = parseFloat(updateData.pricePerUnit.toString())
    }

    const cropListing = await prisma.cropListing.update({
      where: { id },
      data: updateData,
      include: {
        crop: true,
        farmer: {
          select: {
            id: true,
            fullName: true,
            city: true,
            state: true,
            phone: true
          }
        }
      }
    })

    return NextResponse.json({ cropListing })
  } catch (error) {
    console.error('Crop listing update error:', error)
    return NextResponse.json(
      { error: 'Failed to update crop listing' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Crop listing ID is required' },
        { status: 400 }
      )
    }

    await prisma.cropListing.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Crop listing deleted successfully' })
  } catch (error) {
    console.error('Crop listing deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete crop listing' },
      { status: 500 }
    )
  }
}