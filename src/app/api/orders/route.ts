import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'
import { apiSuccess, apiError, handleApiError, parseJsonBody, parseQueryParams } from '@/lib/api-utils'
import { logger } from '@/lib/logger'

const getOrdersSchema = z.object({
  userId: z.string().uuid(),
  type: z.enum(['customer', 'seller']).optional().default('customer'),
})

const orderItemSchema = z.object({
  productId: z.string().uuid().optional().nullable(),
  cropListingId: z.string().uuid().optional().nullable(),
  equipmentId: z.string().uuid().optional().nullable(),
  quantity: z.union([z.string(), z.number()]).transform(Number),
  unitPrice: z.union([z.string(), z.number()]).transform(Number),
  totalPrice: z.union([z.string(), z.number()]).transform(Number),
  rentalStartDate: z.string().datetime().optional().nullable(),
  rentalEndDate: z.string().datetime().optional().nullable(),
})

const createOrderSchema = z.object({
  customerId: z.string().uuid(),
  sellerId: z.string().uuid(),
  orderType: z.string().optional().default('product'),
  totalAmount: z.union([z.string(), z.number()]).transform(Number),
  shippingAddress: z.record(z.string(), z.any()).optional(),
  billingAddress: z.record(z.string(), z.any()).optional(),
  paymentMethod: z.string().optional().default('cash'),
  notes: z.string().optional(),
  items: z.array(orderItemSchema).min(1),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const { userId, type } = parseQueryParams(searchParams, getOrdersSchema)

    const cacheKey = CacheKeys.orders(userId, type)
    const cached = await cache.get(cacheKey)

    if (cached) {
      return apiSuccess({ orders: cached })
    }

    const whereClause = type === 'customer'
      ? { customerId: userId }
      : { sellerId: userId }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        seller: {
          select: {
            fullName: true,
            city: true,
            state: true,
            phone: true,
            email: true
          }
        },
        customer: {
          select: {
            fullName: true,
            city: true,
            state: true,
            phone: true,
            email: true
          }
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                images: true,
                unit: true,
                brand: true
              }
            },
            cropListing: {
              include: {
                crop: {
                  select: {
                    name: true,
                    variety: true
                  }
                }
              }
            },
            equipment: {
              select: {
                name: true,
                images: true,
                category: true,
                brand: true,
                model: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const transformedOrders = orders.map(order => ({
      id: order.id,
      customer_id: order.customerId,
      seller_id: order.sellerId,
      order_type: order.orderType,
      total_amount: order.totalAmount,
      status: order.status,
      payment_status: order.paymentStatus,
      payment_method: order.paymentMethod,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      shipping_address: order.shippingAddress,
      billing_address: order.billingAddress,
      notes: order.notes,
      seller: {
        full_name: order.seller?.fullName,
        city: order.seller?.city,
        state: order.seller?.state,
        phone: order.seller?.phone,
        email: order.seller?.email
      },
      customer: {
        full_name: order.customer?.fullName,
        city: order.customer?.city,
        state: order.customer?.state,
        phone: order.customer?.phone,
        email: order.customer?.email
      },
      items: order.items?.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        rental_start_date: item.rentalStartDate,
        rental_end_date: item.rentalEndDate,
        product: item.product ? {
          name: item.product.name,
          images: item.product.images,
          unit: item.product.unit,
          brand: item.product.brand
        } : undefined,
        crop_listing: item.cropListing ? {
          crop: {
            name: item.cropListing.crop?.name,
            variety: item.cropListing.crop?.variety
          }
        } : undefined,
        equipment: item.equipment ? {
          name: item.equipment.name,
          images: item.equipment.images,
          category: item.equipment.category,
          brand: item.equipment.brand,
          model: item.equipment.model
        } : undefined
      })) || []
    }))

    await cache.set(cacheKey, transformedOrders || [], 120)

    return apiSuccess({ orders: transformedOrders || [] })
  } catch (error) {
    return handleApiError(error, 'GET /api/orders')
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await parseJsonBody(request, createOrderSchema)

    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId: data.customerId,
          sellerId: data.sellerId,
          orderType: data.orderType,
          totalAmount: data.totalAmount,
          shippingAddress: data.shippingAddress,
          billingAddress: data.billingAddress,
          paymentMethod: data.paymentMethod,
          notes: data.notes
        }
      })

      const orderItems = data.items.map((item) => ({
        orderId: order.id,
        productId: item.productId || null,
        cropListingId: item.cropListingId || null,
        equipmentId: item.equipmentId || null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        rentalStartDate: item.rentalStartDate ? new Date(item.rentalStartDate) : null,
        rentalEndDate: item.rentalEndDate ? new Date(item.rentalEndDate) : null
      }))

      await tx.orderItem.createMany({
        data: orderItems
      })

      return await tx.order.findUnique({
        where: { id: order.id },
        include: {
          seller: {
            select: {
              fullName: true,
              city: true,
              state: true
            }
          },
          customer: {
            select: {
              fullName: true
            }
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  images: true
                }
              },
              cropListing: {
                include: {
                  crop: {
                    select: {
                      name: true
                    }
                  }
                }
              },
              equipment: {
                select: {
                  name: true,
                  images: true
                }
              }
            }
          }
        }
      })
    })

    if (!result) {
      return apiError('Failed to create order', 500)
    }

    const transformedOrder = {
      id: result.id,
      customer_id: result.customerId,
      seller_id: result.sellerId,
      order_type: result.orderType,
      total_amount: result.totalAmount,
      status: result.status,
      payment_status: result.paymentStatus,
      payment_method: result.paymentMethod,
      created_at: result.createdAt,
      updated_at: result.updatedAt,
      shipping_address: result.shippingAddress,
      billing_address: result.billingAddress,
      notes: result.notes,
      seller: {
        full_name: result.seller?.fullName,
        city: result.seller?.city,
        state: result.seller?.state
      },
      customer: {
        full_name: result.customer?.fullName
      },
      items: result.items?.map(item => ({
        id: item.id,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice,
        product: item.product ? {
          name: item.product.name,
          images: item.product.images
        } : undefined,
        crop_listing: item.cropListing ? {
          crop: {
            name: item.cropListing.crop?.name
          }
        } : undefined,
        equipment: item.equipment ? {
          name: item.equipment.name,
          images: item.equipment.images
        } : undefined
      })) || []
    }

    await cache.del(CacheKeys.orders(data.customerId, 'customer'))
    await cache.del(CacheKeys.orders(data.sellerId, 'seller'))

    logger.info('Order created', { orderId: result.id, customerId: data.customerId })

    return apiSuccess({ order: transformedOrder }, 201)
  } catch (error) {
    return handleApiError(error, 'POST /api/orders')
  }
}
