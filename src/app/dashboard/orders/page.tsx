'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { ordersAPI } from '@/lib/api-client'
import { supabase } from '@/lib/supabase'
import {
  Package, RefreshCw, ShoppingCart, Sprout, Plus, Calendar,
  Clock, CheckCircle, Settings, Truck, X, ClipboardList,
  Store, User, CreditCard, Wheat, MapPin, FileText, PartyPopper,
  Search, Filter, Download, Phone, Mail, ArrowUpDown, Eye, TrendingUp
} from 'lucide-react'

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
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const searchParams = useSearchParams()

  useEffect(() => {
    if (user && !authLoading) {
      loadOrders()
    }

    if (searchParams?.get('success') === 'true') {
      
      setTimeout(() => {
        toast.success('Orders placed successfully!')

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
        return 'text-gray-900 bg-gray-100'
    }
  }

  // Filter, search, and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Status filter
      if (filter !== 'all' && order.status !== filter) return false

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const matchesOrderId = order.id.toLowerCase().includes(query)
        const matchesSellerName = order.seller?.full_name?.toLowerCase().includes(query)
        const matchesCustomerName = order.customer?.full_name?.toLowerCase().includes(query)
        const matchesItems = order.items?.some(item =>
          item.product?.name?.toLowerCase().includes(query) ||
          item.crop_listing?.crop.name?.toLowerCase().includes(query)
        )
        return matchesOrderId || matchesSellerName || matchesCustomerName || matchesItems
      }

      return true
    })
    .sort((a, b) => {
      let comparison = 0

      if (sortBy === 'date') {
        comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      } else if (sortBy === 'amount') {
        comparison = a.total_amount - b.total_amount
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 px-2 sm:px-0">
      {}
      <div className="relative bg-gradient-to-br from-green-500 via-emerald-600 to-teal-600 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 md:p-8 text-white overflow-hidden shadow-xl">
        {}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-24 h-24 sm:w-48 sm:h-48 md:w-64 md:h-64 bg-white rounded-full -translate-y-12 sm:-translate-y-16 translate-x-12 sm:translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-20 h-20 sm:w-32 sm:h-32 md:w-48 md:h-48 bg-white rounded-full translate-y-10 sm:translate-y-12 -translate-x-10 sm:-translate-x-12"></div>
        </div>

        <div className="relative">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0 pr-2">
                <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold leading-tight break-words">
                  {user?.role === 'consumer' ? 'My Orders' :
                   user?.role === 'farmer' ? 'Crop Sales Orders' :
                   user?.role === 'supplier' ? 'Product Sales Orders' : 'All Orders'}
                </h1>
                <p className="text-white/90 text-xs sm:text-sm lg:text-base mt-0.5 sm:mt-1 leading-snug break-words">
                  {user?.role === 'consumer' ? 'Track your purchases and deliveries' :
                   user?.role === 'farmer' ? 'Manage orders for your crops' :
                   user?.role === 'supplier' ? 'Manage orders for your products' : 'Manage all orders'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setLoading(true)
                loadOrders()
              }}
              className="flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 bg-white/20 backdrop-blur-sm hover:bg-white/30 active:bg-white/25 rounded-lg sm:rounded-xl transition-all duration-300 sm:hover:scale-105 active:scale-95 shadow-lg touch-manipulation"
            >
              <RefreshCw className={`w-4 h-4 sm:w-5 sm:h-5 text-white ${loading ? 'animate-spin' : ''}`} />
              <span className="font-semibold text-xs sm:text-sm hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white/80 backdrop-blur-xl rounded-lg sm:rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-1 sm:p-1.5 md:p-2 sticky top-0 z-10">
        <div className="overflow-x-auto scrollbar-hide -mx-0.5 px-0.5 pb-0.5">
          <nav className="flex gap-1 sm:gap-1.5 md:gap-2 min-w-max">
            {['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`flex-shrink-0 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-2.5 rounded-md sm:rounded-lg md:rounded-xl font-semibold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap touch-manipulation ${
                  filter === status
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-md sm:shadow-lg'
                    : 'text-gray-900 bg-gray-50 hover:bg-gray-100 active:bg-gray-200'
                }`}
              >
                <span className="hidden md:inline">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
                <span className="md:hidden">
                  {status === 'all' ? 'All' :
                   status === 'pending' ? 'Pend' :
                   status === 'confirmed' ? 'Conf' :
                   status === 'processing' ? 'Proc' :
                   status === 'shipped' ? 'Ship' :
                   status === 'delivered' ? 'Deliv' :
                   'Canc'}
                </span>
                <span className={`ml-1 sm:ml-1.5 md:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs font-bold ${
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

      {/* Search and Sort Controls */}
      <div className="bg-white/80 backdrop-blur-xl rounded-xl lg:rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-5 md:p-6">
        <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
          {/* Search Bar */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-900" />
              <input
                type="text"
                placeholder="Search by order ID, seller, customer, or items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-900 hover:text-green-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Sort Controls */}
          <div className="flex gap-2 sm:gap-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
              className="flex-1 lg:flex-initial px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base border border-gray-200 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white transition-all"
            >
              <option value="date">Sort by Date</option>
              <option value="amount">Sort by Amount</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="flex items-center justify-center gap-2 px-3 sm:px-4 md:px-5 py-2.5 sm:py-3 md:py-3.5 bg-gradient-to-r from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 text-gray-700 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition-all shadow-sm hover:shadow"
            >
              <ArrowUpDown className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
            </button>
          </div>
        </div>

        {/* Order Statistics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mt-4 sm:mt-5">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-green-100 overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Total Orders</p>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-green-600 truncate">{orders.length}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-blue-100 overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Total Value</p>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-blue-600 truncate">
              ₹{orders.reduce((sum, order) => sum + Number(order.total_amount), 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-yellow-100 overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Pending</p>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-yellow-600 truncate">
              {orders.filter(o => o.status === 'pending').length}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-purple-100 overflow-hidden">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
              <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600 flex-shrink-0" />
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">Completed</p>
            </div>
            <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-purple-600 truncate">
              {orders.filter(o => o.status === 'delivered').length}
            </p>
          </div>
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
              <Package className="w-10 h-10 sm:w-14 sm:h-14 text-green-600" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2 sm:mb-3">No orders found</h3>
            <p className="text-sm sm:text-base text-gray-900 mb-6 sm:mb-8 max-w-md mx-auto px-4">
              {searchQuery
                ? `No orders match "${searchQuery}". Try a different search term.`
                : filter === 'all'
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
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mb-4"
              >
                <X className="w-5 h-5" />
                <span>Clear Search</span>
              </button>
            )}
            {user?.role === 'consumer' && filter === 'all' && (
              <Link
                href="/dashboard/supplies"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Start Shopping</span>
              </Link>
            )}
            {user?.role === 'farmer' && filter === 'all' && (
              <Link
                href="/dashboard/crops/add"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Sprout className="w-5 h-5" />
                <span>List Your Crops</span>
              </Link>
            )}
            {user?.role === 'supplier' && filter === 'all' && (
              <Link
                href="/dashboard/products/add"
                className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm sm:text-base font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <Plus className="w-5 h-5" />
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
            <div key={order.id} className="group relative bg-white/80 backdrop-blur-xl rounded-lg sm:rounded-xl md:rounded-2xl lg:rounded-3xl shadow-md sm:shadow-lg hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 border border-gray-100 overflow-hidden">
              {}
              <div className="absolute top-0 left-0 right-0 h-1 sm:h-1.5 bg-gray-100">
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
              <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3.5 md:py-4 lg:py-5 border-b border-gray-100">
                {}
                <div className="flex items-start gap-2 sm:gap-2.5 md:gap-3 mb-3">
                  <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg sm:rounded-xl flex items-center justify-center text-white shadow-md">
                    <span className="text-sm sm:text-base md:text-lg font-bold">#{order.id.slice(-2)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-gray-900 truncate">
                      Order #{order.id.slice(-8)}
                    </h3>
                    <div className="flex items-center gap-1 sm:gap-1.5 mt-0.5 sm:mt-1">
                      <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-900 flex-shrink-0" />
                      <span className="text-xs sm:text-sm text-gray-900 truncate">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {}
                <div className="flex items-center justify-between gap-2 sm:gap-3">
                  <span className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 md:px-3 py-1 sm:py-1.5 text-xs font-bold rounded-md sm:rounded-lg shadow-sm flex-shrink-0 ${getStatusColor(order.status)}`}>
                    {order.status === 'pending' ? <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> :
                     order.status === 'confirmed' ? <CheckCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> :
                     order.status === 'processing' ? <Settings className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> :
                     order.status === 'shipped' ? <Truck className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> :
                     order.status === 'delivered' ? <Package className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> :
                     order.status === 'cancelled' ? <X className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" /> : <ClipboardList className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />}
                    <span className="hidden sm:inline truncate">{order.status.charAt(0).toUpperCase() + order.status.slice(1)}</span>
                    <span className="sm:hidden">{order.status.slice(0, 4)}</span>
                  </span>
                  <div className="text-right flex-shrink-0">
                    <p className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent whitespace-nowrap">
                      ₹{order.total_amount.toLocaleString()}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-900">{order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'items'}</p>
                  </div>
                </div>
              </div>

              {}
              <div className="px-3 sm:px-4 md:px-5 lg:px-6 py-3 sm:py-3.5 md:py-4 lg:py-5">
                {}
                <div className="flex flex-col gap-2 sm:gap-2.5 mb-3 sm:mb-4 p-2.5 sm:p-3 md:p-4 bg-gradient-to-r from-gray-50 to-slate-50 rounded-lg sm:rounded-xl">
                  <div className="flex items-start gap-2">
                    {user?.role === 'consumer' ? <Store className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 text-gray-900" /> : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 mt-0.5 text-gray-900" />}
                    <p className="text-xs sm:text-sm font-medium text-gray-700 break-words min-w-0 flex-1">
                      <span className="font-semibold text-gray-900">
                        {user?.role === 'consumer' ? 'Seller: ' : 'Customer: '}
                      </span>
                      {user?.role === 'consumer'
                        ? `${order.seller.full_name}${order.seller.city ? ` (${order.seller.city}, ${order.seller.state})` : ''}`
                        : order.customer.full_name
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-2.5 py-1 sm:py-1.5 bg-white rounded-md sm:rounded-lg shadow-sm self-start">
                    <CreditCard className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                    <span className={`text-xs font-semibold whitespace-nowrap capitalize ${
                      order.payment_status === 'paid' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {order.payment_status}
                    </span>
                  </div>
                </div>

                {}
                <div className="space-y-2 sm:space-y-2.5 mb-3 sm:mb-4 md:mb-5">
                  {order.items?.map((item: any) => (
                    <div key={item.id} className="group flex items-center gap-2 sm:gap-2.5 md:gap-3 p-2 sm:p-2.5 md:p-3 rounded-md sm:rounded-lg md:rounded-xl bg-gray-50/50 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-300 border border-gray-100 touch-manipulation">
                      <div className="flex-shrink-0">
                        {item.product?.images && item.product.images.length > 0 ? (
                          <img
                            src={item.product.images[0]}
                            alt={item.product.name}
                            className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 rounded-md sm:rounded-lg object-cover shadow-sm group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-md sm:rounded-lg flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300">
                            {item.product ? <Package className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-600" /> : <Wheat className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 text-green-600" />}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 line-clamp-2 mb-0.5">
                          {item.product?.name || item.crop_listing?.crop.name}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-900">
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
                  <div className="pt-3 sm:pt-3.5 md:pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-2 sm:gap-2.5 md:gap-3">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'confirmed')}
                        className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg md:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 touch-manipulation"
                      >
                        <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                        <span>Accept</span>
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.id, 'cancelled')}
                        className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-500 to-pink-600 text-white text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg md:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 touch-manipulation"
                      >
                        <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
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
                      <Settings className="w-4 h-4" />
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
                      <Truck className="w-4 h-4" />
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
                      <Package className="w-4 h-4" />
                      <span>Mark as Delivered</span>
                    </button>
                  </div>
                )}

                {}
                <div className="pt-3 sm:pt-3.5 md:pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2 sm:gap-2.5 md:gap-3">
                  {}
                  {user?.id === order.customer_id && order.status !== 'pending' && order.status !== 'cancelled' && (
                    <Link
                      href={`/dashboard/orders/${order.id}/track`}
                      className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg md:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 touch-manipulation flex-1 sm:flex-initial"
                    >
                      <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
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
                      className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-blue-500 to-cyan-600 text-white text-xs sm:text-sm font-semibold rounded-md sm:rounded-lg md:rounded-xl hover:shadow-lg transition-all duration-300 active:scale-95 sm:hover:scale-105 touch-manipulation flex-1 sm:flex-initial"
                    >
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
                      <span className="hidden sm:inline">Download Invoice</span>
                      <span className="sm:hidden">Invoice</span>
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
          <p className="mt-2 text-sm text-gray-900">Loading...</p>
        </div>
      </div>
    }>
      <OrdersPageInternal />
    </Suspense>
  )
}
