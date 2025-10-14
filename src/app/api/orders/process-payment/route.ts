import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, userId } = body

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Session ID and User ID are required' },
        { status: 400 }
      )
    }

    console.log('Processing payment for session:', sessionId, 'user:', userId)

    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (!session || session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: 'Payment not completed or session not found' },
        { status: 400 }
      )
    }

    console.log('Stripe session retrieved:', { 
      payment_status: session.payment_status,
      amount_total: session.amount_total 
    })

    const existingOrder = await prisma.order.findFirst({
      where: {
        stripePaymentIntentId: session.payment_intent as string
      }
    })

    if (existingOrder) {
      return NextResponse.json({
        success: true,
        message: 'Order already processed',
        orderId: existingOrder.id
      })
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            supplier: true
          }
        },
        cropListing: {
          include: {
            farmer: true,
            crop: true
          }
        }
      }
    })

    if (!cartItems || cartItems.length === 0) {
      console.error('No cart items found for user:', userId)
      return NextResponse.json(
        { error: 'No cart items found to process' },
        { status: 400 }
      )
    }

    console.log('Found cart items:', cartItems.length)

    const itemsBySupplier = cartItems.reduce((groups: any, item: any) => {
      const supplierId = item.product?.supplierId || item.cropListing?.farmerId
      const supplierName = item.product?.supplier?.fullName || item.cropListing?.farmer?.fullName
      
      if (!supplierId) return groups
      
      if (!groups[supplierId]) {
        groups[supplierId] = {
          supplierName,
          items: []
        }
      }
      
      groups[supplierId].items.push(item)
      return groups
    }, {})

    const orders = []

    for (const [supplierId, supplierData] of Object.entries(itemsBySupplier) as any) {
      const items = supplierData.items
      const totalAmount = items.reduce((sum: number, item: any) => {
        const price = item.product?.price || item.cropListing?.pricePerUnit || 0
        return sum + (parseFloat(price) * parseFloat(item.quantity))
      }, 0)

      try {
        const order = await prisma.order.create({
          data: {
            customerId: userId,
            sellerId: supplierId,
            orderType: items[0].product ? 'product' : 'crop',
            totalAmount: totalAmount,
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentMethod: 'stripe',
            stripePaymentIntentId: session.payment_intent as string,
            shippingAddress: (session as any).shipping_details ? JSON.parse(JSON.stringify({
              name: (session as any).shipping_details.name,
              address: (session as any).shipping_details.address
            })) : undefined,
            billingAddress: session.customer_details ? JSON.parse(JSON.stringify({
              name: session.customer_details.name,
              email: session.customer_details.email,
              address: session.customer_details.address
            })) : undefined
          }
        })

        console.log('Order created successfully:', order.id)

        for (const item of items) {
          try {
            
            await prisma.orderItem.create({
              data: {
                orderId: order.id,
                productId: item.productId,
                cropListingId: item.cropListingId,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.product?.price || item.cropListing?.pricePerUnit || 0),
                totalPrice: parseFloat(item.product?.price || item.cropListing?.pricePerUnit || 0) * parseFloat(item.quantity)
              }
            })

            console.log('Order item created for order:', order.id)

            if (item.productId && item.product) {
              const newStock = Math.max(0, parseFloat(item.product.stockQuantity || 0) - parseFloat(item.quantity))
              await prisma.product.update({
                where: { id: item.productId },
                data: { stockQuantity: newStock }
              })
            }

            if (item.cropListingId && item.cropListing) {
              const soldQuantity = parseFloat(item.quantity)
              const availableQuantity = parseFloat(item.cropListing.quantityAvailable || 0)
              const newAvailableQuantity = Math.max(0, availableQuantity - soldQuantity)

              await prisma.cropListing.update({
                where: { id: item.cropListingId },
                data: { 
                  quantityAvailable: newAvailableQuantity,
                  isActive: newAvailableQuantity > 0
                }
              })

              if (newAvailableQuantity === 0 && item.cropListing.crop?.id) {
                await prisma.crop.update({
                  where: { id: item.cropListing.crop.id },
                  data: { status: 'sold' }
                })
              }
            }
          } catch (itemError) {
            console.error('Error processing order item:', itemError)
            continue
          }
        }

        await prisma.notification.create({
          data: {
            userId: supplierId,
            title: 'New Order Received',
            message: `You have received a new order #${order.id.slice(-8)} for ₹${totalAmount}`,
            type: 'order',
            actionUrl: `/dashboard/orders`
          }
        })

        orders.push(order)
      } catch (orderError) {
        console.error('Error creating order:', orderError)
        continue
      }
    }

    try {
      await prisma.cartItem.deleteMany({
        where: { userId }
      })
      console.log('Cart cleared successfully')
    } catch (clearError) {
      console.error('Error clearing cart:', clearError)
    }

    console.log(`Successfully created ${orders.length} orders`)

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
      ordersCreated: orders.length,
      orderIds: orders.map(o => o.id)
    })

  } catch (error: any) {
    console.error('Error processing payment:', error)
    return NextResponse.json(
      { error: `Failed to process payment: ${error.message}` },
      { status: 500 }
    )
  }
}