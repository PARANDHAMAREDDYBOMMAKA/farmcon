import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'
import { apiSuccess, handleApiError, parseJsonBody, parseQueryParams } from '@/lib/api-utils'
import { logger } from '@/lib/logger'

const getProductsSchema = z.object({
  supplierId: z.string().uuid().optional(),
  category: z.string().optional(),
})

const createProductSchema = z.object({
  name: z.string().min(2).max(200),
  description: z.string().max(2000).optional(),
  price: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().positive()),
  stockQuantity: z.union([z.string(), z.number()]).transform(Number).pipe(z.number().int().nonnegative()),
  unit: z.string().min(1).max(50),
  brand: z.string().max(100).optional(),
  images: z.array(z.string().url()).optional().default([]),
  categoryId: z.string().uuid(),
  supplierId: z.string().uuid(),
  isActive: z.boolean().optional().default(true),
  specifications: z.record(z.unknown()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { supplierId, category } = parseQueryParams(searchParams, getProductsSchema)

    const cacheKey = CacheKeys.products(supplierId, category)
    const cached = await cache.get(cacheKey)

    if (cached) {
      return apiSuccess({ products: cached })
    }

    const whereClause: Record<string, unknown> = {}

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

    const productsWithRatings = products.map(product => ({
      ...product,
      averageRating: product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0,
      reviewCount: product.reviews.length
    }))

    await cache.set(cacheKey, productsWithRatings, 300)

    return apiSuccess({ products: productsWithRatings })
  } catch (error) {
    return handleApiError(error, 'GET /api/products')
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await parseJsonBody(request, createProductSchema)

    const validImages = data.images.filter(img => img !== null && img !== undefined && img !== '')

    const product = await prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        stockQuantity: data.stockQuantity,
        unit: data.unit,
        brand: data.brand,
        images: validImages,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        isActive: data.isActive,
        specifications: data.specifications,
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

    await cache.invalidatePattern('farmcon:products:*')
    await cache.del(CacheKeys.productsList(data.supplierId))

    logger.info('Product created', { productId: product.id, supplierId: data.supplierId })

    return apiSuccess({ product }, 201)
  } catch (error) {
    return handleApiError(error, 'POST /api/products')
  }
}
