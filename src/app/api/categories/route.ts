import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/categories - Get all categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const parentId = searchParams.get('parentId')
    const includeChildren = searchParams.get('includeChildren') === 'true'
    const isActive = searchParams.get('isActive')

    const whereClause: Prisma.CategoryWhereInput = {}

    if (parentId) {
      whereClause.parentId = parentId
    }

    if (isActive !== null) {
      whereClause.isActive = isActive !== 'false'
    }

    const categories = await prisma.category.findMany({
      where: whereClause,
      include: {
        parent: true,
        ...(includeChildren && { children: true }),
        _count: {
          select: {
            products: true
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Categories fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, imageUrl, parentId } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        description,
        imageUrl,
        parentId: parentId || null
      },
      include: {
        parent: true,
        children: true
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}

// PUT /api/categories - Update a category (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, description, imageUrl, parentId, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    const updateData: Prisma.CategoryUpdateInput = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl
    if (parentId !== undefined) {
      updateData.parent = parentId ? { connect: { id: parentId } } : { disconnect: true }
    }
    if (isActive !== undefined) updateData.isActive = isActive

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      include: {
        parent: true,
        children: true
      }
    })

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Category update error:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories - Delete a category (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Check if category has products
    const productsCount = await prisma.product.count({
      where: { categoryId: id }
    })

    if (productsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that has products. Move products to another category first.' },
        { status: 400 }
      )
    }

    await prisma.category.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Category deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}