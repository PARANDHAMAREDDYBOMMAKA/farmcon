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
  const searchParams = useSearchParams()

  useEffect(() => {
    if (user && !authLoading) {
      loadOrders()
    }

    if (searchParams?.get('success') === 'true') {
      
      setTimeout(() => {
        toast.success('🎉 Orders placed successfully!')
        
        loadOrders()
      }, 100)

      const refreshInterval = setInterval(() => {
        loadOrders()
      }, 3000)

      setTimeout(() => {
        clearInterval(refreshInterval)
      }, 30000)
      
      return () => clearInterval(refreshInterval)
    }
  }, [user, authLoading, searchParams])

  useEffect(() => {
    
    if (user?.id) {
      const subscription = supabase.channel('orders-changes')

      if (user.role === 'consumer') {
        
        subscription.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `customer_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Order update for customer:', payload)
            loadOrders()
            if (payload.eventType === 'INSERT') {
              toast.success('Order confirmed!')
            } else if (payload.eventType === 'UPDATE') {
              toast.success('Order status updated!')
            }
          }
        )
      } else if (user.role === 'farmer' || user.role === 'supplier') {
        
        subscription.on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'orders',
            filter: `seller_id=eq.${user.id}`
          },
          (payload) => {
            console.log('Order update for seller:', payload)
            loadOrders()
            if (payload.eventType === 'INSERT') {
              toast.success('New order received from customer!')
            } else if (payload.eventType === 'UPDATE') {
              toast.success('Order updated!')
            }
          }
        )
      }

      subscription.subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user?.id, user?.role])

  const loadOrders = async () => {
    try {
      if (!user) return

      let orders: any[] = []

      if (user.role === 'consumer') {
        
        orders = await ordersAPI.getOrders(user.id, 'customer')
      } else if (user.role === 'farmer' || user.role === 'supplier') {
        
        orders = await ordersAPI.getOrders(user.id, 'seller')
      } else {
        
        const customerOrders = await ordersAPI.getOrders(user.id, 'customer')
        const sellerOrders = await ordersAPI.getOrders(user.id, 'seller')
        orders = [
          ...customerOrders.map((order: any) => ({ ...order, _viewType: 'customer' })),
          ...sellerOrders.map((order: any) => ({ ...order, _viewType: 'seller' }))
        ]
      }

      orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setOrders(orders)
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update order status')
      }

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
    <div className="space-y-4 sm:space-y-6">
      {}
      <div className="relative bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-white overflow-hidden shadow-xl">
        {}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        <div className="relative flex flex-col gap-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-2xl sm:text-3xl">📦</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold leading-tight break-words">
                {user?.role === 'consumer' ? 'My Orders' :
                 user?.role === 'farmer' ? 'Crop Sales Orders' :
                 user?.role === 'supplier' ? 'Product Sales Orders' : 'All Orders'}
              </h1>
              <p className="text-white/90 text-xs sm:text-sm md:text-base mt-1 leading-snug">
                {user?.role === 'consumer' ? 'Track your purchases and deliveries' :
                 user?.role === 'farmer' ? 'Manage orders for your crops and equipment' :
                 user?.role === 'supplier' ? 'Manage orders for your products' : 'Manage all order activities'
                }
              </p>
            </div>
            <button
              onClick={() => {
                setLoading(true)
                loadOrders()
              }}
              className="flex-shrink-0 flex items-center justify-center gap-2 px-3 sm:px-6 py-2 sm:py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 rounded-lg sm:rounded-xl transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <span className={loading ? 'animate-spin text-lg sm:text-xl' : 'text-lg sm:text-xl'}>🔄</span>
              <span className="font-semibold text-sm hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl shadow-lg border border-gray-100 p-1.5 sm:p-2">
        <div className="overflow-x-auto scrollbar-hide -mx-1 px-1">
          <nav className="flex gap-1.5 sm:gap-2">
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                  filter === status
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                    : 'text-gray-600 bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <span className="hidden sm:inline">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <span className="sm:hidden">
                  {status === 'all' ? 'All' :
                   status === 'pending' ? 'Pend.' :
                   status === 'confirmed' ? 'Conf.' :
                   status === 'processing' ? 'Proc.' :
                   status === 'shipped' ? 'Ship.' :
                   status === 'delivered' ? 'Deliv.' :
                   'Canc.'}
                </span>
                <span className={`ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs font-bold ${
                  filter === status
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}>
                  {status === 'all' ? orders.length : orders.filter(o => o.status === status).length}
                </span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-8 sm:p-12 md:p-16 overflow-hidden">
          {}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-green-500 rounded-full -translate-y-24 sm:-translate-y-32 translate-x-24 sm:translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 sm:w-48 sm:h-48 bg-emerald-500 rounded-full translate-y-16 sm:translate-y-24 -translate-x-16 sm:-translate-x-24"></div>
          </div>

          <div className="relative text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4 sm:mb-6">
              <span className="text-4xl sm:text-6xl">📦</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No orders found</h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
              {filter === 'all'
                ? user?.role === 'consumer'
                  ? 'You haven\'t placed any orders yet. Start shopping to see your orders here!'
                  : user?.role === 'farmer'
                  ? 'No crop sales orders yet. List your crops to start selling!'
                  : user?.role === 'supplier'
                  ? 'No product sales orders yet. Add products to start selling!'
                  : 'No orders found.'
                : `No ${filter} orders found. Try checking other filters.`
              }
            </p>
            {user?.role === 'consumer' && filter === 'all' && (
              <Link
                href="/dashboard/supplies"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span className="text-base sm:text-lg">🛒</span>
                <span>Start Shopping</span>
              </Link>
            )}
            {user?.role === 'farmer' && filter === 'all' && (
              <Link
                href="/dashboard/crops/add"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span className="text-base sm:text-lg">🌱</span>
                <span>List Your Crops</span>
              </Link>
            )}
            {user?.role === 'supplier' && filter === 'all' && (
              <Link
                href="/dashboard/products/add"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span className="text-base sm:text-lg">➕</span>
                <span>Add Products</span>
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4 sm:space-y-6">
          {filteredOrders.map((order) => {
            
            const statusSteps = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']
            const currentStepIndex = statusSteps.indexOf(order.status)
            const progress = order.status === 'cancelled' ? 0 : ((currentStepIndex + 1) / statusSteps.length) * 100

            return (
            <div key={order.id} className="group relative bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl md:rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
              {}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gray-100">
                <div
                  className={`h-full transition-all duration-500 ${
                    order.status === 'cancelled' ? 'bg-red-500' :
                    order.status === 'delivered' ? 'bg-green-500' :
                    'bg-gradient-to-r from-blue-500 to-cyan-500'
                  }`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              {}
              <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5 border-b border-gray-100">
                <div className="flex flex-col gap-3">
                  {}
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-lg">
                      <span className="text-base sm:text-xl font-bold">#{order.id.slice(-2)}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 truncate">
                        Order #{order.id.slice(-8)}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mt-0.5 sm:mt-1">
                        <span className="text-xs sm:text-sm">📅</span>
                        <span className="truncate">
                          {new Date(order.created_at).toLocaleDateString('en-IN', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </p>
                    </div>
                  </div>

                  {}
                  <div className="flex items-center justify-between gap-2 sm:gap-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-lg sm:rounded-xl shadow-sm flex-shrink-0 ${getStatusColor(order.status)}`}>
                      <span className="text-xs sm:text-sm">
                        {order.status === 'pending' ? '⏳' :
                         order.status === 'confirmed' ? '✅' :
                         order.status === 'processing' ? '⚙️' :
                         order.status === 'shipped' ? '🚚' :
                         order.status === 'delivered' ? '📦' :
                         order.status === 'cancelled' ? '❌' : '📋'}
                      </span>
                      <span className="hidden sm:inline">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                      <span className="sm:hidden">{order.status.slice(0, 4)}</span>
                    </span>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent whitespace-nowrap">
                        ₹{order.total_amount.toLocaleString()}
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">{order.items?.length || 0} items</p>
                    </div>
                  </div>
                </div>
              </div>

              {}
              <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-4 md:py-5">
                {}
                <div className="flex flex-col gap-2 sm:gap-3 mb-4 sm:mb-5 p-2.5 sm:p-3 md:p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg sm:rounded-xl">
                  <p className="text-xs sm:text-sm font-medium text-gray-700 flex items-start gap-2">
                    <span className="text-sm sm:text-base flex-shrink-0 mt-0.5">
                      {user?.role === 'consumer' ? '🏪' : '👤'}
                    </span>
                    <span className="break-words min-w-0">
                      {user?.role === 'consumer'
                        ? `Seller: ${order.seller.full_name}${order.seller.city ? ` (${order.seller.city}, ${order.seller.state})` : ''}`
                        : `Customer: ${order.customer.full_name}`
                      }
                    </span>
                  </p>
                  <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-white rounded-lg shadow-sm self-start">
                    <span className="text-xs sm:text-sm">💳</span>
                    <span className={`text-xs font-semibold whitespace-nowrap ${
                      order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                {}
                <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-5">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="group flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg sm:rounded-xl bg-gray-50/50 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 border border-gray-100">
                      <div className="flex-shrink-0">
                        {item.product?.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-lg sm:rounded-xl object-cover shadow-md group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg sm:rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
                            <span className="text-xl sm:text-2xl">
                              {item.product ? '📦' : '🌾'}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 line-clamp-2">
                          {item.product?.name || item.crop_listing?.crop.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">
                          <span className="font-semibold">{item.quantity}</span> ×
                          <span className="font-semibold"> ₹{item.unit_price.toLocaleString()}</span> =
                          <span className="font-bold text-green-600"> ₹{item.total_price.toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {}
                {(user?.role === 'farmer' || user?.role === 'supplier') && order.seller_id === user.id && order.status === 'pending' && (
                  <div className="pt-3 sm:pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:gap-3">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105"
                      >
                        <span className="text-sm sm:text-base">✅</span>
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105"
                      >
                        <span className="text-sm sm:text-base">❌</span>
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                )}

                {(user?.role === 'farmer' || user?.role === 'supplier') && order.seller_id === user.id && order.status === 'confirmed' && (
                  <div className="pt-3 sm:pt-4 border-t border-gray-200">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'processing')}
                      className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105"
                    >
                      <span className="text-sm sm:text-base">⚙️</span>
                      <span>Start Processing</span>
                    </button>
                  </div>
                )}

                {(user?.role === 'farmer' || user?.role === 'supplier') && order.seller_id === user.id && order.status === 'processing' && (
                  <div className="pt-3 sm:pt-4 border-t border-gray-200">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'shipped')}
                      className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105"
                    >
                      <span className="text-sm sm:text-base">🚚</span>
                      <span>Mark as Shipped</span>
                    </button>
                  </div>
                )}

                {(user?.role === 'farmer' || user?.role === 'supplier') && order.seller_id === user.id && order.status === 'shipped' && (
                  <div className="pt-3 sm:pt-4 border-t border-gray-200">
                    <button
                      onClick={() => updateOrderStatus(order.id, 'delivered')}
                      className="w-full flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105"
                    >
                      <span className="text-sm sm:text-base">📦</span>
                      <span>Mark as Delivered</span>
                    </button>
                  </div>
                )}

                {}
                <div className="pt-3 sm:pt-4 border-t border-gray-200 grid grid-cols-1 sm:flex sm:flex-row gap-2 sm:gap-3">
                  {}
                  {user?.id === order.customer_id && order.status !== 'pending' && order.status !== 'cancelled' && (
                    <Link
                      href={`/dashboard/orders/${order.id}/track`}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105"
                    >
                      <span className="text-sm sm:text-base">📍</span>
                      <span>Track Order</span>
                    </Link>
                  )}

                  {}
                  {order.payment_status === 'paid' && (
                    <button
                      onClick={() => {
                        const url = `/api/orders/${order.id}/invoice`
                        window.open(url, '_blank')
                      }}
                      className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105"
                    >
                      <span className="text-sm sm:text-base">📄</span>
                      <span>Download Invoice</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
            )
          })}
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
