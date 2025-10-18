'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import DeliveryTracker from '@/components/delivery/DeliveryTracker'
import DeliveryMap from '@/components/delivery/LeafletDeliveryMap'
import { ordersAPI } from '@/lib/api-client'
import { MapPin, Package } from 'lucide-react'

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/30 py-4 sm:py-6 md:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {}
        <div className="relative bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 md:p-8 text-white overflow-hidden shadow-xl mb-6 sm:mb-8">
          {}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 sm:w-48 md:w-64 h-32 sm:h-48 md:h-64 bg-white rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 sm:w-32 md:w-48 h-24 sm:h-32 md:h-48 bg-white rounded-full translate-y-12 -translate-x-12"></div>
          </div>

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-2 sm:gap-3 flex-1">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <MapPin className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Order Tracking</h1>
                <p className="text-white/90 text-sm sm:text-base mt-1">Real-time delivery updates for order #{order.id.slice(-8)}</p>
              </div>
            </div>
            <Link
              href="/dashboard/orders"
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg sm:rounded-xl text-sm sm:text-base font-medium transition-all shadow-lg hover:shadow-xl"
            >
              ← <span className="hidden sm:inline">Back to Orders</span><span className="sm:hidden">Back</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {}
          <div className="xl:col-span-2">
            <DeliveryTracker order={order} />
          </div>

          {}
          <div className="xl:col-span-1 space-y-4 sm:space-y-6">
            <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden h-fit">
              <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                    <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Live Map Tracking</h2>
                    <p className="text-gray-600 text-xs sm:text-sm">Track your order in real-time</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                <DeliveryMap order={order} className="h-64 sm:h-72 md:h-80 w-full rounded-lg sm:rounded-xl overflow-hidden shadow-md" />
              </div>
            </div>

            {}
            <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-4 sm:p-5 md:p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Order Items</h2>
                    <p className="text-gray-600 text-xs sm:text-sm">{order.items?.length || 0} items in this order</p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-5 md:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg sm:rounded-xl hover:from-green-50 hover:to-emerald-50 transition-all border border-gray-100 hover:border-green-200 overflow-hidden">
                      <div className="flex-shrink-0">
                        {(item.product?.images || item.crop_listing?.images) && (item.product?.images || item.crop_listing?.images)!.length > 0 ? (
                          <img
                            src={(item.product?.images || item.crop_listing?.images)?.[0]}
                            alt={item.product?.name || item.crop_listing?.crop.name}
                            className="h-12 w-12 sm:h-14 sm:w-14 rounded-md sm:rounded-lg object-cover shadow-sm"
                          />
                        ) : (
                          <div className="h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-md sm:rounded-lg flex items-center justify-center shadow-sm">
                            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                          {item.product?.name || item.crop_listing?.crop.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          <span className="font-medium">{item.quantity}</span> × <span className="font-medium">₹{item.unit_price.toLocaleString()}</span>
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-bold text-sm sm:text-base text-green-600 whitespace-nowrap">₹{item.total_price.toLocaleString()}</p>
                      </div>
                    </div>
                  )) || []}
                </div>
                {/* Total */}
                <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-base sm:text-lg font-bold text-gray-900">Total Amount</span>
                    <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      ₹{order.total_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="mt-6 sm:mt-8 bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6">
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-5">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <button
              onClick={() => window.open('tel:support', '_self')}
              className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-green-500 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all"
            >
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-100 to-emerald-100 group-hover:from-green-500 group-hover:to-emerald-600 rounded-lg flex items-center justify-center transition-all">
                <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">📞</span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">Contact Support</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Get help with your order</p>
              </div>
            </button>
            <button
              onClick={() => {
                const url = `/api/orders/${order.id}/invoice`
                window.open(url, '_blank')
              }}
              className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 transition-all"
            >
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-100 to-cyan-100 group-hover:from-blue-500 group-hover:to-cyan-600 rounded-lg flex items-center justify-center transition-all">
                <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">📄</span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">Download Invoice</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Get your order receipt</p>
              </div>
            </button>
            <button className="group flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border-2 border-gray-200 rounded-lg sm:rounded-xl hover:border-purple-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all sm:col-span-2 lg:col-span-1">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-100 to-pink-100 group-hover:from-purple-500 group-hover:to-pink-600 rounded-lg flex items-center justify-center transition-all">
                <span className="text-xl sm:text-2xl group-hover:scale-110 transition-transform">🔄</span>
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">Modify Order</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Update delivery details</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}