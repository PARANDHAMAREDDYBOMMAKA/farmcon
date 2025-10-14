import posthog from 'posthog-js'

export const analytics = {
  
  pageView: (pageName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.capture('page_viewed', {
        page_name: pageName,
        ...properties,
      })
    }
  },

  track: (eventName: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.capture(eventName, properties)
      console.log('📊 Event tracked:', eventName, properties)
    }
  },

  identify: (userId: string, properties?: Record<string, any>) => {
    if (typeof window !== 'undefined') {
      posthog.identify(userId, properties)
      console.log('👤 User identified:', userId)
    }
  },

  productViewed: (productId: string, productName: string, price?: number) => {
    analytics.track('product_viewed', {
      product_id: productId,
      product_name: productName,
      price: price,
    })
  },

  addToCart: (productId: string, productName: string, quantity: number, price?: number) => {
    analytics.track('add_to_cart', {
      product_id: productId,
      product_name: productName,
      quantity: quantity,
      price: price,
      total: price ? price * quantity : undefined,
    })
  },

  checkoutStarted: (cartValue: number, itemCount: number) => {
    analytics.track('checkout_started', {
      cart_value: cartValue,
      item_count: itemCount,
    })
  },

  purchaseCompleted: (orderId: string, totalAmount: number, itemCount: number, paymentMethod: string) => {
    analytics.track('purchase_completed', {
      order_id: orderId,
      total_amount: totalAmount,
      item_count: itemCount,
      payment_method: paymentMethod,
    })
  },

  searchPerformed: (query: string, resultsCount: number) => {
    analytics.track('search_performed', {
      search_query: query,
      results_count: resultsCount,
    })
  },

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

  signinCompleted: (userId: string, method: string) => {
    analytics.identify(userId)
    analytics.track('signin_completed', {
      method: method,
    })
  },

  chatbotInteraction: (action: string, details?: string) => {
    analytics.track('chatbot_interaction', {
      action: action,
      details: details,
    })
  },

  error: (errorMessage: string, errorType: string, context?: Record<string, any>) => {
    analytics.track('error_occurred', {
      error_message: errorMessage,
      error_type: errorType,
      ...context,
    })
  },
}

export default analytics
