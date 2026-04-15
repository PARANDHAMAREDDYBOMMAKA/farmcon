import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    
    const existingCategories = await prisma.category.count()

    if (existingCategories > 0) {
      return NextResponse.json({
        message: 'Categories already exist',
        count: existingCategories
      })
    }

    const defaultCategories = [
      {
        name: 'Seeds',
        description: 'Seeds for various crops including vegetables, fruits, and grains',
        imageUrl: ''
      },
      {
        name: 'Fertilizers',
        description: 'Chemical and organic fertilizers to boost crop growth',
        imageUrl: ''
      },
      {
        name: 'Pesticides',
        description: 'Pest control solutions and insecticides',
        imageUrl: ''
      },
      {
        name: 'Tools',
        description: 'Hand tools and farming implements',
        imageUrl: ''
      },
      {
        name: 'Irrigation',
        description: 'Irrigation systems, pipes, and water management equipment',
        imageUrl: ''
      },
      {
        name: 'Storage',
        description: 'Storage containers, bags, and preservation solutions',
        imageUrl: ''
      },
      {
        name: 'Organic Products',
        description: 'Certified organic farming products and solutions',
        imageUrl: ''
      },
      {
        name: 'Machinery',
        description: 'Heavy farming machinery and equipment',
        imageUrl: ''
      },
      {
        name: 'Animal Feed',
        description: 'Feed and nutrition for livestock and poultry',
        imageUrl: ''
      },
      {
        name: 'Greenhouse Equipment',
        description: 'Equipment for controlled environment agriculture',
        imageUrl: ''
      }
    ]

    const createdCategories = await prisma.category.createMany({
      data: defaultCategories
    })

    return NextResponse.json({
      message: 'Default categories created successfully',
      count: createdCategories.count
    })
  } catch (error) {
    console.error('Category initialization error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize categories' },
      { status: 500 }
    )
  }
}