import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// Delivery notification helper
async function sendDeliveryNotifications(order: any, newStatus: string) {
  try {
    const statusMessages = {
      confirmed: {
        customer: `Your order #${order.id.slice(-8)} has been confirmed by ${order.seller?.fullName}`,
        seller: `Order #${order.id.slice(-8)} has been confirmed`
      },
      processing: {
        customer: `Your order #${order.id.slice(-8)} is being processed`,
        seller: `Order #${order.id.slice(-8)} is now being processed`
      },
      shipped: {
        customer: `Your order #${order.id.slice(-8)} has been shipped by ${order.seller?.fullName}`,
        seller: `Order #${order.id.slice(-8)} has been marked as shipped`
      },
      delivered: {
        customer: `Your order #${order.id.slice(-8)} has been delivered. Thank you for your purchase!`,
        seller: `Order #${order.id.slice(-8)} has been delivered successfully`
      },
      cancelled: {
        customer: `Your order #${order.id.slice(-8)} has been cancelled`,
        seller: `Order #${order.id.slice(-8)} has been cancelled`
      }
    }

    const messages = statusMessages[newStatus as keyof typeof statusMessages]
    if (!messages) return

    // Create notification for customer
    await prisma.notification.create({
      data: {
        userId: order.customerId,
        title: `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: messages.customer,
        type: 'delivery',
        actionUrl: `/dashboard/orders/${order.id}/track`
      }
    })

    // Create notification for seller
    await prisma.notification.create({
      data: {
        userId: order.sellerId,
        title: `Order ${newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}`,
        message: messages.seller,
        type: 'order',
        actionUrl: `/dashboard/orders`
      }
    })

    console.log(`Delivery notifications sent for order ${order.id}, status: ${newStatus}`)
  } catch (error) {
    console.error('Error sending delivery notifications:', error)
  }
}

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

    // Send delivery status notifications
    if (status) {
      await sendDeliveryNotifications(order, status)
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
    console.error('Error in order update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}