'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

function OrderSuccessPageInternal() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [orderConfirmed, setOrderConfirmed] = useState(false)

  useEffect(() => {
    const session_id = searchParams?.get('session_id')
    if (session_id && user?.id) {
      setSessionId(session_id)
      confirmPayment(session_id)
    } else if (!session_id) {
      
      router.push('/dashboard/orders')
    }
  }, [searchParams, router, user])

  const confirmPayment = async (session_id: string) => {
    try {
      
      const stripeResponse = await fetch('/api/checkout/stripe', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: session_id })
      })

      if (stripeResponse.ok) {
        const { success, paymentStatus } = await stripeResponse.json()
        if (success && paymentStatus === 'paid') {
          
          await processOrder(session_id)
          setOrderConfirmed(true)
          toast.success('🎉 Payment successful! Your order has been confirmed.')

          setTimeout(() => {
            window.location.href = '/dashboard/cart?payment_success=true'
          }, 2000)
        }
      } else {
        
        await processOrder(session_id)
        setOrderConfirmed(true)
        toast.success('🎉 Payment successful! Your order has been confirmed.')

        setTimeout(() => {
          window.location.href = '/dashboard/cart?payment_success=true'
        }, 2000)
      }
    } catch (error) {
      console.error('Error confirming payment:', error)
      toast.error('Unable to confirm payment status. Please check your orders.')
    }
  }

  const processOrder = async (session_id: string) => {
    if (!user?.id) return

    try {
      
      const response = await fetch('/api/orders/process-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          sessionId: session_id,
          userId: user.id 
        })
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Order processing result:', result)
      }
    } catch (error) {
      console.error('Error processing order:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {}
        <div className="text-center mb-8">
          {orderConfirmed ? (
            
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-green-600 rounded-full animate-ping opacity-75"></div>
              <div className="relative w-24 h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center transform transition-all duration-500 scale-100 hover:scale-110 shadow-2xl">
                <svg className="w-12 h-12 text-white animate-[checkmark_0.6s_ease-in-out]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          ) : (
            
            <div className="w-24 h-24 mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-pulse opacity-60"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full animate-ping opacity-40"></div>
              <div className="relative w-24 h-24 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full flex items-center justify-center shadow-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <h1 className={`text-3xl font-bold mb-3 transition-all duration-500 ${
            orderConfirmed
              ? 'text-green-600 animate-[slideUp_0.5s_ease-out]'
              : 'text-blue-600 animate-pulse'
          }`}>
            {orderConfirmed ? 'Order Confirmed!' : 'Processing Payment...'}
          </h1>

          <p className="text-gray-600 text-lg animate-[fadeIn_0.8s_ease-in]">
            {orderConfirmed
              ? 'Thank you for your purchase! Your order has been successfully placed.'
              : 'Please wait while we confirm your payment and create your order...'
            }
          </p>
        </div>

        {}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">What happens next?</h2>
          
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📧</span>
              <div>
                <h3 className="font-medium text-gray-900">Order Confirmation</h3>
                <p className="text-sm text-gray-600">You'll receive an email confirmation with order details</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-2xl">📦</span>
              <div>
                <h3 className="font-medium text-gray-900">Processing</h3>
                <p className="text-sm text-gray-600">Your order will be prepared and shipped by the seller</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <span className="text-2xl">🚚</span>
              <div>
                <h3 className="font-medium text-gray-900">Delivery Tracking</h3>
                <p className="text-sm text-gray-600">Track your order status in real-time on the orders page</p>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="space-y-3">
          <Link
            href="/dashboard/orders"
            className="w-full flex items-center justify-center px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <span className="mr-2">📋</span>
            View My Orders
          </Link>
          
          <Link
            href="/dashboard/supplies"
            className="w-full flex items-center justify-center px-6 py-4 bg-white text-green-600 rounded-xl font-semibold hover:bg-green-50 transition-all duration-200 border-2 border-green-200"
          >
            <span className="mr-2">🛒</span>
            Continue Shopping
          </Link>
          
          <Link
            href="/dashboard"
            className="w-full flex items-center justify-center px-6 py-4 bg-gray-100 text-gray-600 rounded-xl font-medium hover:bg-gray-200 transition-all duration-200"
          >
            <span className="mr-2">🏠</span>
            Go to Dashboard
          </Link>
        </div>

        {}
        {sessionId && process.env.NODE_ENV === 'development' && (
          <div className="mt-6 text-center text-xs text-gray-400">
            Session ID: {sessionId.slice(-8)}
          </div>
        )}
      </div>
    </div>
  )
}
export default function () {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <OrderSuccessPageInternal />
    </Suspense>
  )
}
