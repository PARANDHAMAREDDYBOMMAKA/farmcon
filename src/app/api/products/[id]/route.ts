import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteMultipleFromCloudinary } from '@/lib/cloudinary'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        supplier: {
          select: {
            id: true,
            fullName: true,
            businessName: true,
            city: true,
            state: true,
            phone: true
          }
        },
        category: true,
        reviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                fullName: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const averageRating = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0

    const productWithRating = {
      ...product,
      averageRating,
      reviewCount: product.reviews.length
    }

    return NextResponse.json({ product: productWithRating })
  } catch (error) {
    console.error('Product fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
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
    const {
      name,
      description,
      price,
      stockQuantity,
      unit,
      brand,
      images,
      categoryId,
      isActive
    } = body

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(stockQuantity !== undefined && { stockQuantity: parseInt(stockQuantity) }),
        ...(unit && { unit }),
        ...(brand !== undefined && { brand }),
        ...(images && { images }),
        ...(categoryId && { categoryId }),
        ...(isActive !== undefined && { isActive })
      },
      include: {
        supplier: {
          select: {
            id: true,
            fullName: true,
            businessName: true
          }
        },
        category: true
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product update error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const product = await prisma.product.update({
      where: { id: params.id },
      data: body,
      include: {
        supplier: {
          select: {
            id: true,
            fullName: true,
            businessName: true
          }
        },
        category: true
      }
    })

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product patch error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      select: { images: true }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.images && product.images.length > 0) {
      await deleteMultipleFromCloudinary(product.images)
    }

    await prisma.product.delete({
      where: { id: params.id }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Product deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}