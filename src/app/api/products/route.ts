import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'

// GET /api/products - Get products
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const supplierId = searchParams.get('supplierId')
    const category = searchParams.get('category')

    // Try to get from cache first
    const cacheKey = CacheKeys.products(supplierId || undefined, category || undefined)
    const cached = await cache.get(cacheKey)

    if (cached) {
      return NextResponse.json({ products: cached })
    }

    const whereClause: any = {}

    if (supplierId) {
      whereClause.supplierId = supplierId
    }

    if (category) {
      whereClause.category = {
        name: category
      }
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        supplier: {
          select: {
            id: true,
            fullName: true,
            businessName: true
          }
        },
        category: true,
        reviews: {
          select: {
            rating: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Calculate average ratings
    const productsWithRatings = products.map(product => ({
      ...product,
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews.length
    }))

    // Cache for 5 minutes
    await cache.set(cacheKey, productsWithRatings, 300)

    return NextResponse.json({ products: productsWithRatings })
  } catch (error) {
    console.error('Products fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
export async function POST(request: NextRequest) {
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
      supplierId,
      isActive = true
    } = body

    // Validate required fields
    if (!name || !price || !stockQuantity || !unit || !categoryId || !supplierId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Filter out null/undefined images
    const validImages = Array.isArray(images) ? images.filter(img => img !== null && img !== undefined && img !== '') : []

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stockQuantity: parseInt(stockQuantity),
        unit,
        brand,
        images: validImages,
        categoryId,
        supplierId,
        isActive
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

    // Invalidate product caches
    await cache.invalidatePattern('farmcon:products:*')
    await cache.del(CacheKeys.productsList(supplierId))

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}