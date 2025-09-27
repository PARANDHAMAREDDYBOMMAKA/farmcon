'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { ordersAPI } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'

interface OrderWithDetails {
  id: string
  customer_id: string
  seller_id: string
  order_type: string
  total_amount: number
  status: string
  payment_status: string
  created_at: string
  updated_at: string
  seller: {
    full_name: string
    city?: string
    state?: string
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
    }
    equipment?: {
      name: string
      images: string[]
    }
  }>
}

function OrdersPageInternal() {
  const { user, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [viewType, setViewType] = useState<'customer' | 'seller'>('customer')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (user && !authLoading) {
      loadOrders()
    }
    
    // Check for success parameter
    if (searchParams?.get('success') === 'true') {
      // Show success message and force refresh
      setTimeout(() => {
        toast.success('🎉 Orders placed successfully!')
        // Force refresh orders to ensure they appear
        loadOrders()
      }, 100)
      
      // Set up interval to keep refreshing until orders appear
      const refreshInterval = setInterval(() => {
        loadOrders()
      }, 3000)
      
      // Stop refreshing after 30 seconds
      setTimeout(() => {
        clearInterval(refreshInterval)
      }, 30000)
      
      return () => clearInterval(refreshInterval)
    }
  }, [user, authLoading, searchParams])

  useEffect(() => {
    // Set up real-time subscription for orders
    if (user?.id) {
      const subscription = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New order created:', payload)
            // Reload orders when new ones are created
            loadOrders()
            toast.success('New order received!')
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${user.id}`
          },
          (payload) => {
            console.log('New sale order:', payload)
            // Reload orders when new sales come in
            loadOrders()
            toast.success('New order received from customer!')
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user?.id])

  const loadOrders = async () => {
    try {
      if (!user) return

      // Load orders using API - get both customer and seller orders
      const customerOrders = await ordersAPI.getOrders(user.id, 'customer')
      const sellerOrders = await ordersAPI.getOrders(user.id, 'seller')
      
      // Combine orders and mark which type they are
      const allOrders = [
        ...customerOrders.map((order: any) => ({ ...order, _viewType: 'customer' })),
        ...sellerOrders.map((order: any) => ({ ...order, _viewType: 'seller' }))
      ]
      
      // Sort by created date
      allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      
      setOrders(allOrders)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Update order status via API
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update order status')
      }

      // Update local state
      setOrders(orders => 
        orders.map(order => 
          order.id === orderId ? { ...order, status: newStatus as any } : order
        )
      )

      toast.success('Order status updated successfully!')

    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'confirmed':
        return 'text-blue-600 bg-blue-100'
      case 'processing':
        return 'text-purple-600 bg-purple-100'
      case 'shipped':
        return 'text-indigo-600 bg-indigo-100'
      case 'delivered':
        return 'text-green-600 bg-green-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {user?.role === 'farmer' || user?.role === 'supplier' ? 'Sales Orders' : 'My Orders'}
            </h1>
            <p className="text-gray-600">
              {user?.role === 'farmer' || user?.role === 'supplier' 
                ? 'Manage orders for your products' 
                : 'Track your purchases and deliveries'
              }
            </p>
          </div>
          <button
            onClick={() => {
              setLoading(true)
              loadOrders()
            }}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  filter === status
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                <span className="ml-2 py-0.5 px-2 rounded-full text-xs bg-gray-100">
                  {status === 'all' ? orders.length : orders.filter(o => o.status === status).length}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl">📦</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No orders found</h3>
          <p className="mt-2 text-gray-500">
            {filter === 'all' 
              ? user?.role === 'farmer' || user?.role === 'supplier'
                ? 'No sales orders yet.'
                : 'You haven\'t placed any orders yet.'
              : `No ${filter} orders found.`
            }
          </p>
          {user?.role !== 'farmer' && user?.role !== 'supplier' && (
            <Link
              href="/dashboard/supplies"
              className="mt-6 inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Start Shopping
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Order #{order.id.slice(-8)}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('en-IN', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-gray-900">₹{order.total_amount}</p>
                      <p className="text-sm text-gray-500">{order.items?.length || 0} items</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="px-6 py-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-600">
                    {user?.role === 'farmer' || user?.role === 'supplier' 
                      ? `Customer: ${order.customer.full_name}`
                      : `Seller: ${order.seller.full_name} (${order.seller.city}, ${order.seller.state})`
                    }
                  </p>
                  <p className="text-sm text-gray-500">
                    Payment: {order.payment_status}
                  </p>
                </div>

                {/* Order Items */}
                <div className="space-y-3">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        {item.product?.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                            <span className="text-xl">
                              {item.product ? '📦' : '🌾'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.product?.name || item.crop_listing?.crop.name}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity} × ₹{item.unit_price} = ₹{item.total_price}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action buttons for sellers */}
                {(user?.role === 'farmer' || user?.role === 'supplier') && order.status === 'pending' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                      >
                        Accept Order
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="px-4 py-2 bg-red-600 text-white text-sm rounded-md hover:bg-red-700"
                      >
                        Decline Order
                      </button>
                    </div>
                  </div>
                )}

                {(user?.role === 'farmer' || user?.role === 'supplier') && order.status === 'confirmed' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      Start Processing
                    </button>
                  </div>
                )}

                {(user?.role === 'farmer' || user?.role === 'supplier') && order.status === 'processing' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                    >
                      Mark as Shipped
                    </button>
                  </div>
                )}

                {(user?.role === 'farmer' || user?.role === 'supplier') && order.status === 'shipped' && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      Mark as Delivered
                    </button>
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex space-x-3">
                  {/* Track Order button for customers */}
                  {user?.id === order.customer_id && order.status !== 'pending' && order.status !== 'cancelled' && (
                    <Link
                      href={`/dashboard/orders/${order.id}/track`}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                    >
                      <span>📍</span>
                      <span>Track Order</span>
                    </Link>
                  )}

                  {/* Invoice button */}
                  {order.payment_status === 'paid' && (
                    <button
                      onClick={() => {
                        const url = `/api/orders/${order.id}/invoice`
                        window.open(url, '_blank')
                      }}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                    >
                      <span>📄</span>
                      <span>Download Invoice</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
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
      <OrdersPageInternal />
    </Suspense>
  )
}
