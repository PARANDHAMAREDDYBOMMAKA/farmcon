'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { profileAPI } from '@/lib/api-client'
import type { User } from '@/types'
import { PartyPopper, ShoppingCart, Package, Trash2, Check, CreditCard, Banknote, Loader2 } from 'lucide-react'

interface CartItemWithProduct {
  id: string
  userId: string
  productId?: string
  cropListingId?: string
  quantity: number
  createdAt: string
  updatedAt: string
  product?: {
    id: string
    name: string
    price: number
    unit: string
    images: string[]
    stockQuantity: number
    supplier: {
      fullName: string
    }
  }
  cropListing?: {
    id: string
    pricePerUnit: number
    unit: string
    images: string[]
    quantityAvailable: number
    farmer: {
      fullName: string
    }
    crop: {
      name: string
    }
  }
}

export default function CartPage() {
  const [user, setUser] = useState<User | null>(null)
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadCart()

    const urlParams = new URLSearchParams(window.location.search)
    if (urlParams.get('payment_success') === 'true') {
      
      setTimeout(() => {
        loadCart()
        toast.success('Payment completed! Your cart has been cleared.')

        window.history.replaceState({}, '', '/dashboard/cart')

        setTimeout(() => {
          router.push('/dashboard/orders?success=true')
        }, 2000)
      }, 1000)
    }

    const subscription = supabase
      .channel('cart-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cart_items',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Cart updated:', payload)

          if (payload.eventType === 'DELETE') {
            
            setCartItems(prev => prev.filter(item => item.id !== payload.old.id))

            if (payload.old.user_id === user?.id) {
              setTimeout(() => {
                if (cartItems.length <= 1) {
                  toast.success('Cart cleared - Payment successful!')
                }
              }, 500)
            }
          } else {
            
            loadCart()
          }
        }
      )
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id])

  const loadCart = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/signin')
        return
      }

      const profile = await profileAPI.getProfile(session.user.id)
      if (profile) {
        setUser(profile)
      }

      const response = await fetch(`/api/cart?userId=${session.user.id}`)
      if (response.ok) {
        const { cartItems } = await response.json()
        setCartItems(cartItems || [])
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      await removeItem(itemId)
      return
    }

    setUpdating(itemId)
    
    try {
      const response = await fetch('/api/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItemId: itemId,
          quantity: newQuantity
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update quantity')
      }

      setCartItems(items => 
        items.map(item => 
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        )
      )

    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
    } finally {
      setUpdating(null)
    }
  }

  const removeItem = async (itemId: string) => {
    setUpdating(itemId)
    
    try {
      const response = await fetch(`/api/cart?cartItemId=${itemId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to remove item')
      }

      setCartItems(items => items.filter(item => item.id !== itemId))

    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    } finally {
      setUpdating(null)
    }
  }

  const checkout = async (paymentMethod = 'stripe') => {
    if (!user || cartItems.length === 0) return

    setCheckingOut(true)
    const loadingToast = toast.loading(
      paymentMethod === 'stripe' 
        ? 'Redirecting to payment...' 
        : 'Processing your order...'
    )
    
    try {
      const response = await fetch('/api/cart/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          cartItems,
          paymentMethod
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Checkout failed')
      }

      const data = await response.json()

      if (data.checkoutType === 'stripe' && data.redirectUrl) {
        toast.success('Redirecting to Stripe checkout...', { id: loadingToast })
        
        window.location.href = data.redirectUrl
        return
      } else {
        toast.success('Order placed successfully!', { id: loadingToast })
        
        setCartItems([])
        
        router.push('/dashboard/orders?success=true')
      }

    } catch (error) {
      console.error('Checkout error:', error)
      toast.error(`Checkout failed: ${(error as Error).message || 'Please try again.'}`, { id: loadingToast })
    } finally {
      setCheckingOut(false)
    }
  }

  const totalAmount = cartItems.reduce((sum, item) => sum + ((item.product?.price || item.cropListing?.pricePerUnit || 0) * Number(item.quantity)), 0)
  const totalItems = cartItems.reduce((sum, item) => sum + Number(item.quantity), 0)

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading cart...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="mt-2 text-gray-900 text-lg">{totalItems} items in your cart</p>
        </div>

        {cartItems.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-24 h-24 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-6">
              <ShoppingCart className="w-12 h-12 text-green-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">Your cart is empty</h3>
            <p className="text-gray-900 text-lg mb-8">Start shopping to add items to your cart.</p>
            <Link
              href="/dashboard/supplies"
              className="inline-flex items-center px-8 py-4 border border-transparent rounded-xl shadow-sm text-lg font-medium text-white bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
            >
              Browse Supplies
              <span className="ml-2">→</span>
            </Link>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {}
            <div className="lg:col-span-2 mb-8 lg:mb-0">
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-green-50 to-blue-50 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Cart Items</h2>
                </div>
                <div className="divide-y divide-gray-100">
                  {cartItems.map((item, index) => (
                    <div key={item.id} className={`p-6 flex items-center space-x-4 hover:bg-gray-50 transition-colors ${index === 0 ? 'rounded-t-2xl' : ''}`}>
                      <div className="flex-shrink-0">
                        {((item.product?.images || item.cropListing?.images) && (item.product?.images || item.cropListing?.images)!.length > 0) ? (
                          <img
                            src={(item.product?.images || item.cropListing?.images)?.[0]}
                            alt={item.product?.name || item.cropListing?.crop.name}
                            className="h-16 w-16 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-16 w-16 bg-green-100 rounded-lg flex items-center justify-center">
                            <Package className="w-8 h-8 text-green-600" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                          {item.product?.name || item.cropListing?.crop.name}
                        </h3>
                        <p className="text-sm text-gray-900">
                          by {item.product?.supplier.fullName || item.cropListing?.farmer.fullName}
                        </p>
                        <p className="text-sm text-gray-900">
                          ₹{item.product?.price || item.cropListing?.pricePerUnit} per {item.product?.unit || item.cropListing?.unit}
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="flex items-center">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            disabled={updating === item.id}
                            className="p-2 rounded-lg text-gray-900 hover:text-green-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                          >
                            {updating === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : '−'}
                          </button>
                          <span className="mx-4 text-sm font-semibold w-8 text-center">
                            {updating === item.id ? '...' : item.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, Number(item.quantity) + 1)}
                            disabled={updating === item.id || item.quantity >= (item.product?.stockQuantity || item.cropListing?.quantityAvailable || 0)}
                            className="p-2 rounded-lg text-gray-900 hover:text-green-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
                          >
                            {updating === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : '+'}
                          </button>
                        </div>

                        <div className="text-sm font-medium text-gray-900 w-20 text-right">
                          ₹{((item.product?.price || item.cropListing?.pricePerUnit || 0) * item.quantity).toFixed(2)}
                        </div>

                        <button
                          onClick={() => removeItem(item.id)}
                          disabled={updating === item.id}
                          className="p-2 text-red-400 hover:text-red-600 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div>
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden sticky top-8">
                <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">Order Summary</h2>
                </div>
                <div className="p-6">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-900">Subtotal ({totalItems} items)</span>
                      <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Shipping</span>
                      <span className="text-green-600 font-medium flex items-center">
                        <Check className="w-4 h-4 text-green-500 mr-1" />
                        Free
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-900">Tax</span>
                      <span className="text-gray-900">Included</span>
                    </div>
                  </div>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="flex justify-between mb-6">
                      <span className="text-xl font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-green-600">₹{totalAmount.toFixed(2)}</span>
                    </div>
                    {}
                    <div className="mb-6">
                      <p className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</p>
                      <div className="space-y-3">
                        <button
                          onClick={() => checkout('stripe')}
                          disabled={checkingOut || cartItems.length === 0}
                          className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          <CreditCard className="w-5 h-5" />
                          <span>{checkingOut ? 'Processing...' : 'Pay with Card'}</span>
                          {!checkingOut && <span className="text-blue-200">→</span>}
                        </button>
                        <button
                          onClick={() => checkout('cod')}
                          disabled={checkingOut || cartItems.length === 0}
                          className="w-full flex items-center justify-center space-x-3 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 shadow-lg"
                        >
                          <Banknote className="w-5 h-5" />
                          <span>{checkingOut ? 'Processing...' : 'Cash on Delivery'}</span>
                          {!checkingOut && <span className="text-green-200">→</span>}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 text-center">
                <Link
                  href="/dashboard/supplies"
                  className="inline-flex items-center text-green-600 hover:text-green-500 font-medium transition-colors duration-200 hover:underline"
                >
                  <span className="mr-2">←</span>
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}