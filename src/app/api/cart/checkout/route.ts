import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// POST /api/cart/checkout - Redirect to Stripe checkout
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, cartItems, paymentMethod = 'stripe' } = body

    console.log('Checkout request:', { 
      userId, 
      itemCount: cartItems?.length, 
      paymentMethod,
      firstItem: cartItems?.[0] ? {
        id: cartItems[0].id,
        hasProduct: !!cartItems[0].product,
        hasCropListing: !!cartItems[0].cropListing,
        productId: cartItems[0].productId,
        cropListingId: cartItems[0].cropListingId
      } : null
    })

    if (!userId || !cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { error: 'User ID and cart items are required' },
        { status: 400 }
      )
    }

    if (paymentMethod === 'stripe') {
      // Convert cart items to Stripe line items format
      const stripeItems = cartItems.map((item: any) => {
        let name, price, images, unit, sellerId
        
        if (item.product) {
          // Product item
          name = item.product.name
          price = parseFloat(item.product.price)
          images = item.product.images || []
          unit = item.product.unit
          sellerId = item.product.supplier?.id
        } else if (item.cropListing) {
          // Crop listing item
          name = item.cropListing.crop.name
          price = parseFloat(item.cropListing.pricePerUnit)
          images = item.cropListing.images || []
          unit = item.cropListing.unit
          sellerId = item.cropListing.farmer?.id || item.cropListing.farmerId
        } else {
          // Fallback
          name = 'Farm Product'
          price = 0
          images = []
          unit = 'unit'
          sellerId = null
        }

        console.log('Processing item:', { name, price, quantity: item.quantity, sellerId })

        return {
          name,
          description: `${name} - Quantity: ${item.quantity} ${unit}`,
          unitPrice: price,
          quantity: parseInt(item.quantity),
          images: images,
          sellerId: sellerId
        }
      })

      const totalAmount = stripeItems.reduce((sum: number, item: any) => sum + (item.unitPrice * item.quantity), 0)
      
      console.log('Stripe items:', stripeItems)
      console.log('Total amount:', totalAmount)

      // Call Stripe checkout API
      const host = request.headers.get('host')
      const baseUrl = host?.includes('localhost') ? 
        `http://localhost:3000` : 
        `https://${host}`
      
      console.log('Calling Stripe API at:', `${baseUrl}/api/checkout/stripe`)
      
      const stripeResponse = await fetch(`${baseUrl}/api/checkout/stripe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          items: stripeItems,
          totalAmount,
          metadata: {
            cartCheckout: true,
            itemIds: cartItems.map((item: any) => item.id).join(',')
          }
        })
      })

      if (!stripeResponse.ok) {
        const errorData = await stripeResponse.text()
        console.error('Stripe API error:', errorData)
        throw new Error(`Failed to create Stripe checkout session: ${errorData}`)
      }

      const stripeData = await stripeResponse.json()
      console.log('Stripe response:', stripeData)
      
      return NextResponse.json({
        success: true,
        redirectUrl: stripeData.url,
        sessionId: stripeData.sessionId,
        checkoutType: 'stripe'
      })
    } else {
      // For COD or other payment methods, create order directly
      // Group items by supplier for separate orders
      const itemsBySupplier = cartItems.reduce((groups: any, item: any) => {
        const supplierId = item.product?.supplier?.id || item.cropListing?.farmer?.id || item.cropListing?.farmerId
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

      // Create orders for each supplier
      for (const [supplierId, supplierData] of Object.entries(itemsBySupplier) as any) {
        const items = supplierData.items
        const totalAmount = items.reduce((sum: number, item: any) => {
          const price = item.product?.price || item.cropListing?.pricePerUnit || 0
          return sum + (price * item.quantity)
        }, 0)

        // Create order using Prisma
        const order = await prisma.order.create({
          data: {
            customerId: userId,
            sellerId: supplierId,
            orderType: items[0].product ? 'product' : 'crop',
            totalAmount: totalAmount,
            status: 'pending',
            paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending',
            paymentMethod: paymentMethod
          }
        })

        // Create order items and update inventory for each item in this supplier's order
        for (const item of items) {
          try {
            // Create order item using Prisma
            await prisma.orderItem.create({
              data: {
                orderId: order.id,
                productId: item.productId || null,
                cropListingId: item.cropListingId || null,
                quantity: parseFloat(item.quantity),
                unitPrice: parseFloat(item.product?.price || item.cropListing?.pricePerUnit || 0),
                totalPrice: parseFloat(item.product?.price || item.cropListing?.pricePerUnit || 0) * parseFloat(item.quantity)
              }
            })
          } catch (itemError) {
            console.error('Error creating order item:', itemError)
            continue
          }

          // Update inventory for products
          if (item.productId && item.product) {
            try {
              const newStock = Math.max(0, parseFloat(item.product.stockQuantity || 0) - parseFloat(item.quantity))
              await prisma.product.update({
                where: { id: item.productId },
                data: { stockQuantity: newStock }
              })
            } catch (stockError) {
              console.error('Error updating product stock:', stockError)
            }
          }

          // Update crop listing quantity and status
          if (item.cropListingId && item.cropListing) {
            try {
              const soldQuantity = parseFloat(item.quantity)
              const availableQuantity = parseFloat(item.cropListing.quantityAvailable || 0)
              const newAvailableQuantity = Math.max(0, availableQuantity - soldQuantity)

              // Update crop listing quantity
              await prisma.cropListing.update({
                where: { id: item.cropListingId },
                data: { 
                  quantityAvailable: newAvailableQuantity,
                  isActive: newAvailableQuantity > 0
                }
              })

              // Update main crop status to sold if completely sold
              if (newAvailableQuantity === 0 && item.cropListing.crop?.id) {
                await prisma.crop.update({
                  where: { id: item.cropListing.crop.id },
                  data: { status: 'sold' }
                })
                console.log('Updated crop status to sold for crop:', item.cropListing.crop.id)
              }
            } catch (cropError) {
              console.error('Error updating crop listing/status:', cropError)
            }
          }
        }

        // Send notification to seller using Prisma
        try {
          await prisma.notification.create({
            data: {
              userId: supplierId,
              title: 'New Order Received',
              message: `You have received a new ${paymentMethod === 'cod' ? 'COD' : ''} order #${order.id.slice(-8)} for ₹${totalAmount}`,
              type: 'order',
              actionUrl: `/dashboard/orders`
            }
          })
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError)
        }

        orders.push(order)
      }

      // Clear cart after successful order creation using Prisma
      await prisma.cartItem.deleteMany({
        where: { userId }
      })

      return NextResponse.json({ 
        success: true, 
        orders, 
        message: 'Order placed successfully',
        checkoutType: 'direct'
      })
    }

  } catch (error: any) {
    console.error('Checkout error:', error)
    console.error('Error stack:', error.stack)
    return NextResponse.json(
      { error: `Checkout failed: ${error.message}` },
      { status: 500 }
    )
  }
}