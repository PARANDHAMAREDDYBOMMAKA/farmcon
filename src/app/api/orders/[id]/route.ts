import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Transform to match frontend expectations
    const transformedOrder = {
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
    }

    return NextResponse.json({ order: transformedOrder })
  } catch (error) {
    console.error('Error in order API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const orderId = params.id
    const body = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const { status, paymentStatus, notes } = body

    const updateData: any = {
      updatedAt: new Date()
    }

    if (status) updateData.status = status
    if (paymentStatus) updateData.paymentStatus = paymentStatus
    if (notes !== undefined) updateData.notes = notes

    const order = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
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
      }
    })

    // Transform to match frontend expectations
    const transformedOrder = {
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
    }

    return NextResponse.json({ order: transformedOrder })
  } catch (error) {
    console.error('Error in order update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}