'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import redis from '@/lib/redis'
import type { User } from '@/types'

interface AdminStats {
  users: {
    total: number
    farmers: number
    consumers: number
    suppliers: number
    admins: number
    verified: number
  }
  crops: {
    total: number
    planted: number
    growing: number
    harvested: number
    listed_for_sale: number
  }
  products: {
    total: number
    active: number
    out_of_stock: number
  }
  equipment: {
    total: number
    available: number
    rented: number
  }
  orders: {
    total: number
    pending: number
    completed: number
    cancelled: number
  }
  revenue: {
    total_gmv: number
    monthly_gmv: number
  }
}

interface RecentActivity {
  id: string
  type: 'user_signup' | 'crop_listed' | 'order_placed' | 'equipment_added'
  description: string
  timestamp: string
  user_name?: string
}

export default function AdminDashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [activeTab, setActiveTab] = useState('overview')
  const router = useRouter()

  useEffect(() => {
    loadAdminData()
  }, [])

  const loadAdminData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/signin')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (!profile || profile.role !== 'admin') {
        router.push('/dashboard')
        return
      }

      setUser(profile)

      const cacheKey = 'admin_stats'
      const cachedStats = await redis.get(cacheKey)
      
      if (cachedStats) {
        setStats(JSON.parse(cachedStats))
      } else {
        await loadStats()
      }

      await loadRecentActivity()

    } catch (error) {
      console.error('Error loading admin data:', error)
      router.push('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      
      const { data: users } = await supabase
        .from('profiles')
        .select('role, email_verified')

      const { data: crops } = await supabase
        .from('crops')
        .select('status')

      const { data: products } = await supabase
        .from('products')
        .select('stock_quantity, is_active')

      const { data: equipment } = await supabase
        .from('equipment')
        .select('status')

      const { data: orders } = await supabase
        .from('orders')
        .select('status, total_amount, created_at')

      const { data: cropListings } = await supabase
        .from('crop_listings')
        .select('price_per_unit, quantity_available')

      const userStats = {
        total: users?.length || 0,
        farmers: users?.filter(u => u.role === 'farmer').length || 0,
        consumers: users?.filter(u => u.role === 'consumer').length || 0,
        suppliers: users?.filter(u => u.role === 'supplier').length || 0,
        admins: users?.filter(u => u.role === 'admin').length || 0,
        verified: users?.filter(u => u.email_verified).length || 0,
      }

      const cropStats = {
        total: crops?.length || 0,
        planted: crops?.filter(c => c.status === 'planted').length || 0,
        growing: crops?.filter(c => c.status === 'growing').length || 0,
        harvested: crops?.filter(c => c.status === 'harvested').length || 0,
        listed_for_sale: crops?.filter(c => c.status === 'sold').length || 0,
      }

      const productStats = {
        total: products?.length || 0,
        active: products?.filter(p => p.is_active).length || 0,
        out_of_stock: products?.filter(p => p.stock_quantity === 0).length || 0,
      }

      const equipmentStats = {
        total: equipment?.length || 0,
        available: equipment?.filter(e => e.status === 'available').length || 0,
        rented: equipment?.filter(e => e.status === 'rented').length || 0,
      }

      const orderStats = {
        total: orders?.length || 0,
        pending: orders?.filter(o => o.status === 'pending').length || 0,
        completed: orders?.filter(o => o.status === 'delivered').length || 0,
        cancelled: orders?.filter(o => o.status === 'cancelled').length || 0,
      }

      const totalGMV = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0
      const currentMonth = new Date().getMonth()
      const currentYear = new Date().getFullYear()
      const monthlyGMV = orders?.filter(order => {
        const orderDate = new Date(order.created_at)
        return orderDate.getMonth() === currentMonth && orderDate.getFullYear() === currentYear
      }).reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

      const adminStats: AdminStats = {
        users: userStats,
        crops: cropStats,
        products: productStats,
        equipment: equipmentStats,
        orders: orderStats,
        revenue: {
          total_gmv: totalGMV,
          monthly_gmv: monthlyGMV
        }
      }

      setStats(adminStats)

      await redis.set('admin_stats', JSON.stringify(adminStats), { ex: 600 })

    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadRecentActivity = async () => {
    try {
      
      const activities: RecentActivity[] = [
        {
          id: '1',
          type: 'user_signup',
          description: 'New farmer registered',
          timestamp: new Date().toISOString(),
          user_name: 'Ram Kumar'
        },
        {
          id: '2',
          type: 'crop_listed',
          description: 'New crop listing: Tomatoes',
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          user_name: 'Priya Sharma'
        },
        {
          id: '3',
          type: 'order_placed',
          description: 'Order placed for ₹2,500',
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          user_name: 'Suresh Patel'
        },
        {
          id: '4',
          type: 'equipment_added',
          description: 'New equipment listed: John Deere Tractor',
          timestamp: new Date(Date.now() - 10800000).toISOString(),
          user_name: 'Raj Singh'
        }
      ]

      setRecentActivity(activities)
    } catch (error) {
      console.error('Error loading recent activity:', error)
    }
  }

  const getActivityIcon = (type: RecentActivity['type']) => {
    switch (type) {
      case 'user_signup': return '👤'
      case 'crop_listed': return '🌾'
      case 'order_placed': return '🛒'
      case 'equipment_added': return '🚜'
      default: return '📝'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="p-6">
        <div className="text-center">
          <span className="text-6xl">⚠️</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Failed to load dashboard data</h3>
          <button 
            onClick={loadAdminData}
            className="mt-4 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Platform overview and management tools</p>
      </div>

      {}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'users', label: 'Users' },
              { key: 'content', label: 'Content' },
              { key: 'orders', label: 'Orders' },
              { key: 'reports', label: 'Reports' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {activeTab === 'overview' && (
        <>
          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Users</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.users.total}</p>
              <div className="mt-2 text-sm">
                <span className="text-green-600">↗ {stats.users.verified} verified</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Crops</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.crops.total}</p>
              <div className="mt-2 text-sm">
                <span className="text-blue-600">{stats.crops.growing} growing</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
              <p className="text-3xl font-bold text-gray-900">{stats.orders.total}</p>
              <div className="mt-2 text-sm">
                <span className="text-yellow-600">{stats.orders.pending} pending</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-sm font-medium text-gray-500">Monthly GMV</h3>
              <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.revenue.monthly_gmv)}</p>
              <div className="mt-2 text-sm">
                <span className="text-green-600">Total: {formatCurrency(stats.revenue.total_gmv)}</span>
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Farmers</span>
                  <span className="font-medium">{stats.users.farmers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Consumers</span>
                  <span className="font-medium">{stats.users.consumers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Suppliers</span>
                  <span className="font-medium">{stats.users.suppliers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Admins</span>
                  <span className="font-medium">{stats.users.admins}</span>
                </div>
              </div>
            </div>

            {}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Crop Status</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Planted</span>
                  <span className="font-medium text-blue-600">{stats.crops.planted}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Growing</span>
                  <span className="font-medium text-green-600">{stats.crops.growing}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Harvested</span>
                  <span className="font-medium text-purple-600">{stats.crops.harvested}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Listed for Sale</span>
                  <span className="font-medium text-orange-600">{stats.crops.listed_for_sale}</span>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3">
                  <span className="text-2xl">{getActivityIcon(activity.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {activity.description}
                      {activity.user_name && (
                        <span className="font-medium"> by {activity.user_name}</span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Management</h3>
          <div className="space-y-4">
            <Link 
              href="/dashboard/admin/users"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">Manage Users</h4>
              <p className="text-sm text-gray-500">View, edit, and manage user accounts and permissions</p>
            </Link>
            <Link 
              href="/dashboard/admin/verifications"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">Pending Verifications</h4>
              <p className="text-sm text-gray-500">Review and approve user verification requests</p>
            </Link>
          </div>
        </div>
      )}

      {activeTab === 'content' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Content Management</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/dashboard/admin/products"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">Products ({stats.products.total})</h4>
              <p className="text-sm text-gray-500">Manage pesticides and supplies listings</p>
            </Link>
            <Link 
              href="/dashboard/admin/crops"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">Crop Listings ({stats.crops.listed_for_sale})</h4>
              <p className="text-sm text-gray-500">Oversee farmer crop marketplace</p>
            </Link>
            <Link 
              href="/dashboard/admin/equipment"
              className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
            >
              <h4 className="font-medium text-gray-900">Equipment ({stats.equipment.total})</h4>
              <p className="text-sm text-gray-500">Monitor equipment rental listings</p>
            </Link>
            <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
              <h4 className="font-medium text-gray-500">Content Moderation</h4>
              <p className="text-sm text-gray-400">Review reported content and enforce policies</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Management</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{stats.orders.pending}</p>
              <p className="text-sm text-yellow-800">Pending Orders</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{stats.orders.completed}</p>
              <p className="text-sm text-green-800">Completed Orders</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{stats.orders.cancelled}</p>
              <p className="text-sm text-red-800">Cancelled Orders</p>
            </div>
          </div>
          <Link 
            href="/dashboard/admin/orders"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
          >
            View All Orders
          </Link>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports & Analytics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Revenue Analytics</h4>
              <p className="text-sm text-gray-500 mb-4">Track platform revenue and growth metrics</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total GMV:</span>
                  <span className="font-medium">{formatCurrency(stats.revenue.total_gmv)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">This Month:</span>
                  <span className="font-medium">{formatCurrency(stats.revenue.monthly_gmv)}</span>
                </div>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Platform Activity</h4>
              <p className="text-sm text-gray-500 mb-4">Monitor user engagement and platform usage</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Active Listings:</span>
                  <span className="font-medium">{stats.products.active + stats.crops.listed_for_sale + stats.equipment.available}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Verified Users:</span>
                  <span className="font-medium">{stats.users.verified}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}