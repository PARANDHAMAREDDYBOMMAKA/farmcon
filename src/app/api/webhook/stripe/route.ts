import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { headers } from 'next/headers'
import { supabase } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = (await headers()).get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 })
  }

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    if (!webhookSecret) {
      console.error('Missing Stripe webhook secret')
      return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
    }

    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        console.log('Payment succeeded:', session.id)

        // Get session details
        const checkoutSession = await stripe.checkout.sessions.retrieve(session.id, {
          expand: ['line_items', 'payment_intent']
        })

        if (checkoutSession.payment_status === 'paid' && checkoutSession.metadata?.userId) {
          await handleSuccessfulPayment(checkoutSession)
        }
        
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any
        console.log('Payment intent succeeded:', paymentIntent.id)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any
        console.log('Payment failed:', paymentIntent.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}

async function handleSuccessfulPayment(session: any) {
  try {
    const metadata = session.metadata
    const userId = metadata.userId

    if (!userId) {
      console.error('No userId in session metadata')
      return
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile) {
      console.error('User profile not found:', userId)
      return
    }

    // Get cart items if this was a cart checkout using Prisma
    let cartItems: any[] = []
    if (metadata.cartCheckout) {
      console.log('Fetching cart items for user:', userId)
      try {
        cartItems = await prisma.cartItem.findMany({
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
        console.log('Found cart items:', cartItems.length)
      } catch (error) {
        console.error('Error fetching cart items:', error)
      }
    }

    // Group items by seller for separate orders
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

    // Create orders for each supplier or single order if no cart items
    if (Object.keys(itemsBySupplier).length === 0) {
      // Single order without cart items (direct purchase) - using Prisma
      try {
        const order = await prisma.order.create({
          data: {
            customerId: userId,
            sellerId: metadata.sellerId || userId,
            orderType: metadata.orderType || 'product',
            totalAmount: session.amount_total / 100,
            status: 'confirmed',
            paymentStatus: 'paid',
            paymentMethod: 'stripe',
            stripePaymentIntentId: session.payment_intent?.id || session.payment_intent,
            shippingAddress: session.shipping_details ? {
              name: session.shipping_details.name,
              address: session.shipping_details.address
            } : undefined,
            billingAddress: session.customer_details ? {
              name: session.customer_details.name,
              email: session.customer_details.email,
              address: session.customer_details.address
            } : undefined
          }
        })

        orders.push(order)
      } catch (error) {
        console.error('Error creating order:', error)
        return
      }
    } else {
      // Create orders for each supplier from cart
      for (const [supplierId, supplierData] of Object.entries(itemsBySupplier) as any) {
        const items = supplierData.items
        const totalAmount = items.reduce((sum: number, item: any) => {
          const price = item.product?.price || item.cropListing?.pricePerUnit || 0
          return sum + (parseFloat(price) * parseFloat(item.quantity))
        }, 0)

        // Create order using Prisma
        let order
        try {
          order = await prisma.order.create({
            data: {
              customerId: userId,
              sellerId: supplierId,
              orderType: items[0].product ? 'product' : 'crop',
              totalAmount: totalAmount,
              status: 'confirmed',
              paymentStatus: 'paid',
              paymentMethod: 'stripe',
              stripePaymentIntentId: session.payment_intent?.id || session.payment_intent,
              shippingAddress: session.shipping_details ? {
                name: session.shipping_details.name,
                address: session.shipping_details.address
              } : undefined,
              billingAddress: session.customer_details ? {
                name: session.customer_details.name,
                email: session.customer_details.email,
                address: session.customer_details.address
              } : undefined
            }
          })
        } catch (error) {
          console.error('Error creating order:', error)
          continue
        }

        // Create order items and update inventory/crop status
        for (const item of items) {
          try {
            // Create order item using Prisma
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

            // Update inventory for products
            if (item.productId && item.product) {
              const newStock = Math.max(0, parseFloat(item.product.stockQuantity || 0) - parseFloat(item.quantity))
              await prisma.product.update({
                where: { id: item.productId },
                data: { stockQuantity: newStock }
              })
            }

            // Update crop listing quantity and status
            if (item.cropListingId && item.cropListing) {
              const soldQuantity = parseFloat(item.quantity)
              const availableQuantity = parseFloat(item.cropListing.quantityAvailable || 0)
              const newAvailableQuantity = Math.max(0, availableQuantity - soldQuantity)

              // Update crop listing quantity
              await prisma.cropListing.update({
                where: { id: item.cropListingId },
                data: { 
                  quantityAvailable: newAvailableQuantity,
                  isActive: newAvailableQuantity > 0 // Deactivate if sold out
                }
              })

              // Update main crop status to sold if completely sold
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

        orders.push(order)
      }
    }

    // Clear cart items after successful payment using Prisma
    if (metadata.cartCheckout) {
      try {
        await prisma.cartItem.deleteMany({
          where: { userId }
        })
        console.log('Cart cleared successfully')
      } catch (clearError) {
        console.error('Error clearing cart:', clearError)
      }
    }

    console.log(`${orders.length} order(s) created successfully`)

    // Send notifications to sellers using Prisma
    for (const order of orders) {
      try {
        await prisma.notification.create({
          data: {
            userId: order.sellerId,
            title: 'New Order Received',
            message: `You have received a new order #${order.id.slice(-8)} for ₹${order.totalAmount}`,
            type: 'order',
            actionUrl: `/dashboard/orders`
          }
        })
      } catch (notificationError) {
        console.error('Error sending notification:', notificationError)
      }
    }

  } catch (error) {
    console.error('Error handling successful payment:', error)
  }
}