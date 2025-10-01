import posthog from 'posthog-js'

// Analytics helper functions
export const analytics = {
  // Track page views
  pageView: (pageName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.capture('page_viewed', {
        page_name: pageName,
        ...properties,
      })
    }
  },

  // Track user actions
  track: (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.capture(eventName, properties)
      console.log('📊 Event tracked:', eventName, properties)
    }
  },

  // Identify user
  identify: (userId: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, properties)
      console.log('👤 User identified:', userId)
    }
  },

  // Track product views
  productViewed: (productId: string, productName: string, price?: number) => {
    analytics.track('product_viewed', {
      product_id: productId,
      product_name: productName,
      price: price,
    })
  },

  // Track add to cart
  addToCart: (productId: string, productName: string, quantity: number, price?: number) => {
    analytics.track('add_to_cart', {
      product_id: productId,
      product_name: productName,
      quantity: quantity,
      price: price,
      total: price ? price * quantity : undefined,
    })
  },

  // Track checkout
  checkoutStarted: (cartValue: number, itemCount: number) => {
    analytics.track('checkout_started', {
      cart_value: cartValue,
      item_count: itemCount,
    })
  },

  // Track purchase
  purchaseCompleted: (orderId: string, totalAmount: number, itemCount: number, paymentMethod: string) => {
    analytics.track('purchase_completed', {
      order_id: orderId,
      total_amount: totalAmount,
      item_count: itemCount,
      payment_method: paymentMethod,
    })
  },

  // Track search
  searchPerformed: (query: string, resultsCount: number) => {
    analytics.track('search_performed', {
      search_query: query,
      results_count: resultsCount,
    })
  },

  // Track signup
  signupCompleted: (userId: string, method: string, role?: string) => {
    analytics.identify(userId, {
      signup_method: method,
      user_role: role,
    })
    analytics.track('signup_completed', {
      method: method,
      role: role,
    })
  },

  // Track signin
  signinCompleted: (userId: string, method: string) => {
    analytics.identify(userId)
    analytics.track('signin_completed', {
      method: method,
    })
  },

  // Track chatbot interaction
  chatbotInteraction: (action: string, details?: string) => {
    analytics.track('chatbot_interaction', {
      action: action,
      details: details,
    })
  },

  // Track errors
  error: (errorMessage: string, errorType: string, context?: Record<string, any>) => {
    analytics.track('error_occurred', {
      error_message: errorMessage,
      error_type: errorType,
      ...context,
    })
  },
}

export default analytics
