import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const type = searchParams.get('type') || 'customer' 

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('Fetching orders for userId:', userId, 'type:', type)

    const cacheKey = CacheKeys.orders(userId, type)
    const cached = await cache.get(cacheKey)

    if (cached) {
      return NextResponse.json({ orders: cached })
    }

    try {
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

      console.log('Found orders:', transformedOrders?.length || 0)
      return NextResponse.json({ orders: transformedOrders || [] })

    } catch (dbError) {
      console.error('Database connection error:', dbError)
      return NextResponse.json({ orders: [] })
    }
  } catch (error) {
    console.error('Orders fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const {
      customerId,
      sellerId,
      orderType,
      totalAmount,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
      items = []
    } = body

    if (!customerId || !sellerId || !totalAmount || !items.length) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      
      const order = await tx.order.create({
        data: {
          customerId: customerId,
          sellerId: sellerId,
          orderType: orderType || 'product',
          totalAmount: parseFloat(totalAmount),
          shippingAddress: shippingAddress,
          billingAddress: billingAddress,
          paymentMethod: paymentMethod || 'cash',
          notes: notes
        }
      })

      const orderItems = items.map((item: any) => ({
        orderId: order.id,
        productId: item.productId || null,
        cropListingId: item.cropListingId || null,
        equipmentId: item.equipmentId || null,
        quantity: parseFloat(item.quantity),
        unitPrice: parseFloat(item.unitPrice),
        totalPrice: parseFloat(item.totalPrice),
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

    const transformedOrder = result ? {
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
    } : null

    await cache.del(CacheKeys.orders(customerId, 'customer'))
    await cache.del(CacheKeys.orders(sellerId, 'seller'))

    return NextResponse.json({ order: transformedOrder })
  } catch (error) {
    console.error('Order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}