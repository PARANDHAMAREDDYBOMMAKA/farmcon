import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      userId, 
      items, 
      shippingAddress, 
      billingAddress,
      totalAmount,
      metadata = {}
    } = body

    console.log('Stripe checkout request:', { userId, itemCount: items?.length, totalAmount })

    if (!userId || !items || !items.length || !totalAmount) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, items, and totalAmount' },
        { status: 400 }
      )
    }

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 500 }
      )
    }

    // Get user profile for customer info
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileError) {
      console.error('Profile fetch error:', profileError)
      // Continue without profile data
    }

    // Create line items for Stripe
    const lineItems = items.map((item: any) => ({
      price_data: {
        currency: 'inr',
        product_data: {
          name: item.name || 'Farm Product',
          description: item.description || '',
          images: item.images && item.images.length > 0 ? [item.images[0]] : []
        },
        unit_amount: Math.round(item.unitPrice * 100) // Convert to paise
      },
      quantity: item.quantity
    }))

    // Construct proper URLs for success and cancel
    const host = request.headers.get('host')
    const protocol = host?.includes('localhost') ? 'http' : 'https'
    const baseUrl = `${protocol}://${host}`
    
    console.log('Stripe checkout URL base:', baseUrl)

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/dashboard/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/dashboard/cart?canceled=true`,
      customer_email: profile?.email,
      metadata: {
        userId,
        orderType: 'product',
        ...metadata
      },
      shipping_address_collection: {
        allowed_countries: ['IN']
      },
      billing_address_collection: 'required',
      payment_intent_data: {
        metadata: {
          userId,
          orderType: 'product',
          ...metadata
        }
      }
    })

    // Store session info temporarily (you might want to store this in your database)
    const checkoutData = {
      sessionId: session.id,
      userId,
      items,
      shippingAddress,
      billingAddress,
      totalAmount,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      checkoutData
    })

  } catch (error: any) {
    console.error('Stripe checkout error:', error)
    console.error('Error details:', error.message)
    console.error('Error stack:', error.stack)
    
    // Check if it's a Stripe-specific error
    if (error.type) {
      console.error('Stripe error type:', error.type)
      console.error('Stripe error code:', error.code)
    }
    
    return NextResponse.json(
      { error: `Failed to create checkout session: ${error.message}` },
      { status: 500 }
    )
  }
}

// Handle Stripe webhook events
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { sessionId, status } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Retrieve the checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    if (session.payment_status === 'paid') {
      // Payment successful - create order in database
      const metadata = session.metadata
      
      if (metadata?.userId) {
        // Here you would create the actual order in your database
        // For now, we'll just return success
        return NextResponse.json({ 
          success: true, 
          paymentStatus: 'paid',
          orderId: `order_${Date.now()}`
        })
      }
    }

    return NextResponse.json({ 
      success: false, 
      paymentStatus: session.payment_status 
    })

  } catch (error: any) {
    console.error('Stripe session verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}