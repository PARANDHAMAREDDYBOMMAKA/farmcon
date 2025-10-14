'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import DeliveryTracker from '@/components/delivery/DeliveryTracker'
import DeliveryMap from '@/components/delivery/LeafletDeliveryMap'
import { ordersAPI } from '@/lib/api-client'

interface OrderDetails {
  id: string
  customer_id: string
  seller_id: string
  order_type: string
  total_amount: number
  status: string
  payment_status: string
  payment_method: string
  created_at: string
  updated_at: string
  shipping_address: any
  billing_address?: any
  seller: {
    full_name: string
    city?: string
    state?: string
    address?: string
  }
  customer: {
    full_name: string
  }
  items: Array<{
    id: string
    quantity: number
    unit_price: number
    total_price: number
    product?: {
      name: string
      images: string[]
    }
    crop_listing?: {
      crop: {
        name: string
      }
      images: string[]
    }
  }>
}

export default function OrderTrackingPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const orderId = params?.id as string

  useEffect(() => {
    if (user && !authLoading && orderId) {
      loadOrder()
    }
  }, [user, authLoading, orderId])

  const loadOrder = async () => {
    try {
      if (!orderId) return

      const orderData = await ordersAPI.getOrderById(orderId)

      if (orderData.customer_id !== user?.id && orderData.seller_id !== user?.id) {
        router.push('/dashboard/orders')
        return
      }

      setOrder(orderData)
    } catch (error) {
      console.error('Error loading order:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-6">
        <div className="text-center">
          <span className="text-6xl">❓</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Order not found</h3>
          <Link
            href="/dashboard/orders"
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Tracking</h1>
              <p className="text-gray-600 mt-1">Real-time delivery updates for your order</p>
            </div>
            <Link
              href="/dashboard/orders"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              ← Back to Orders
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {}
          <div className="xl:col-span-2">
            <DeliveryTracker order={order} />
          </div>

          {}
          <div className="xl:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden h-fit">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Live Map Tracking</h2>
                <p className="text-gray-600 text-sm mt-1">Track your order in real-time</p>
              </div>
              <div className="p-6">
                <DeliveryMap order={order} className="h-80 w-full rounded-lg overflow-hidden" />
              </div>
            </div>

            {}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Order Items</h2>
                <p className="text-gray-600 text-sm mt-1">{order.items?.length || 0} items in this order</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0">
                        {(item.product?.images || item.crop_listing?.images) && (item.product?.images || item.crop_listing?.images)!.length > 0 ? (
                          <img
                            src={(item.product?.images || item.crop_listing?.images)?.[0]}
                            alt={item.product?.name || item.crop_listing?.crop.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-lg">{item.product ? '📦' : '🌾'}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.product?.name || item.crop_listing?.crop.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {item.quantity} × ₹{item.unit_price}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-900">₹{item.total_price}</p>
                      </div>
                    </div>
                  )) || []}
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">📞</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">Contact Support</p>
                <p className="text-sm text-gray-500">Get help with your order</p>
              </div>
            </button>
            <button className="flex items-center justify-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">📄</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">Download Invoice</p>
                <p className="text-sm text-gray-500">Get your order receipt</p>
              </div>
            </button>
            <button className="flex items-center justify-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <span className="text-2xl">🔄</span>
              <div className="text-left">
                <p className="font-medium text-gray-900">Modify Order</p>
                <p className="text-sm text-gray-500">Update delivery details</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}