import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Crop listing ID is required' },
        { status: 400 }
      )
    }

    const cropListing = await prisma.cropListing.findUnique({
      where: { id },
      include: {
        crop: true,
        farmer: {
          select: {
            id: true,
            fullName: true,
            city: true,
            state: true,
            phone: true,
            email: true,
            address: true,
            pincode: true
          }
        }
      }
    })

    if (!cropListing) {
      return NextResponse.json(
        { error: 'Crop listing not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ cropListing })
  } catch (error) {
    console.error('Error fetching crop listing:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crop listing' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Crop listing ID is required' },
        { status: 400 }
      )
    }

    const { id: _, ...updateData } = body

    if (updateData.harvestDate) {
      updateData.harvestDate = new Date(updateData.harvestDate)
    }
    if (updateData.expiryDate) {
      updateData.expiryDate = new Date(updateData.expiryDate)
    }

    if (updateData.quantityAvailable !== undefined) {
      updateData.quantityAvailable = parseFloat(updateData.quantityAvailable.toString())
    }
    if (updateData.pricePerUnit !== undefined) {
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
    console.error('Error updating crop listing:', error)
    return NextResponse.json(
      { error: 'Failed to update crop listing' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
    console.error('Error deleting crop listing:', error)
    return NextResponse.json(
      { error: 'Failed to delete crop listing' },
      { status: 500 }
    )
  }
}
