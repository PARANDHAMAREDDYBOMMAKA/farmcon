'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { dashboardAPI, ordersAPI, cropsAPI, equipmentAPI } from '@/lib/api-client'

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [weatherData, setWeatherData] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    if (user && !authLoading) {
      loadDashboardData()
    }
    
    // Set up interval to refresh stats periodically
    const statsInterval = setInterval(() => {
      if (user && !authLoading) {
        loadDashboardStats() // Refresh stats every 30 seconds
      }
    }, 30000)
    
    return () => clearInterval(statsInterval)
  }, [user, authLoading])

  const loadDashboardData = async () => {
    try {
      if (!user) return

      // Load dashboard stats
      await loadDashboardStats()
      
      // Load recent activity
      await loadRecentActivity()
      
      // Load weather data if farmer
      if (user.role === 'farmer') {
        await loadWeatherData()
      }
      
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    try {
      if (!user) return
      const stats = await dashboardAPI.getStats(user.id, user.role)
      setStats(stats)
    } catch (error) {
      console.error('Error loading dashboard stats:', error)
      setStats({})
    }
  }

  const loadRecentActivity = async () => {
    try {
      if (!user) return
      
      // Load recent orders and other activities
      const customerOrders = await ordersAPI.getOrders(user.id, 'customer')
      const sellerOrders = await ordersAPI.getOrders(user.id, 'seller')
      
      const activities = [
        ...customerOrders.slice(0, 3).map((order: any) => ({
          id: order.id,
          type: 'purchase',
          title: `Order #${order.id.slice(-8)}`,
          description: `Purchased from ${order.seller?.full_name}`,
          amount: order.total_amount,
          date: order.created_at,
          status: order.status
        })),
        ...sellerOrders.slice(0, 3).map((order: any) => ({
          id: order.id,
          type: 'sale',
          title: `Sale #${order.id.slice(-8)}`,
          description: `Sold to ${order.customer?.full_name}`,
          amount: order.total_amount,
          date: order.created_at,
          status: order.status
        }))
      ]
      
      // Sort by date and take latest 5
      activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setRecentActivity(activities.slice(0, 5))
    } catch (error) {
      console.error('Error loading recent activity:', error)
      setRecentActivity([])
    }
  }

  const loadWeatherData = async () => {
    try {
      if (!user) return

      const location = user.city && user.state ? `${user.city}, ${user.state}` : user.city || 'New Delhi, India'
      
      const response = await fetch(`/api/weather?location=${encodeURIComponent(location)}`)
      const data = await response.json()

      if (data.weather) {
        setWeatherData({
          location: data.weather.location,
          temperature: data.weather.temperature,
          condition: data.weather.condition,
          humidity: data.weather.humidity,
          windSpeed: data.weather.windSpeed,
          rainfall: data.weather.rainfall,
          forecast: data.weather.forecast.map((item: any) => ({
            day: item.date,
            high: item.high,
            low: item.low,
            condition: item.condition
          }))
        })
      }
    } catch (error) {
      console.error('Error loading weather data:', error)
      // Fallback to mock data
      setWeatherData({
        location: user?.city || 'Your Location',
        temperature: 28,
        condition: 'Partly Cloudy',
        humidity: 65,
        windSpeed: 12,
        rainfall: 0.5,
        forecast: [
          { day: 'Today', high: 32, low: 24, condition: 'Sunny' },
          { day: 'Tomorrow', high: 30, low: 22, condition: 'Cloudy' },
          { day: 'Day 3', high: 29, low: 23, condition: 'Rain' }
        ]
      })
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Morning'
    if (hour < 17) return 'Afternoon'
    return 'Evening'
  }


  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const renderFarmerDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Good {getGreeting()}, {user?.fullName || 'Farmer'}! 🌱</h1>
        <p className="text-green-100">Manage your crops and grow your agricultural business</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Crops</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeCrops || 0}</p>
              <p className="text-xs text-green-600 mt-1">+2 this month</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">🌱</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">₹{(stats.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-xs text-green-600 mt-1">+12% from last month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingOrders || 0}</p>
              <p className="text-xs text-yellow-600 mt-1">Needs attention</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Equipment Listed</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.equipmentCount || 0}</p>
              <p className="text-xs text-purple-600 mt-1">Rental income</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">🚜</span>
            </div>
          </div>
        </div>
      </div>

      {/* Weather Widget for Farmers */}
      {weatherData && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Weather Forecast</h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-700">{weatherData.location}</h4>
                <div className="text-4xl font-bold text-blue-600 mt-2">{weatherData.temperature}°C</div>
                <p className="text-gray-600">{weatherData.condition}</p>
                <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                  <div>
                    <p className="text-gray-500">Humidity</p>
                    <p className="font-semibold">{weatherData.humidity}%</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Wind</p>
                    <p className="font-semibold">{weatherData.windSpeed} km/h</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="lg:col-span-2">
              <h5 className="font-medium text-gray-700 mb-3">3-Day Forecast</h5>
              <div className="grid grid-cols-3 gap-4">
                {weatherData.forecast.map((day: any, index: number) => (
                  <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">{day.day}</p>
                    <p className="text-xs text-gray-500 mt-1">{day.condition}</p>
                    <div className="mt-2">
                      <span className="text-sm font-semibold">{day.high}°</span>
                      <span className="text-sm text-gray-500 ml-1">{day.low}°</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/crops/add" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <span className="text-2xl mb-2">🌱</span>
            <span className="text-sm font-medium text-gray-700">Add Crop</span>
          </Link>
          <Link href="/dashboard/sell" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <span className="text-2xl mb-2">💰</span>
            <span className="text-sm font-medium text-gray-700">Create Listing</span>
          </Link>
          <Link href="/dashboard/equipment/add" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <span className="text-2xl mb-2">🚜</span>
            <span className="text-sm font-medium text-gray-700">List Equipment</span>
          </Link>
          <Link href="/dashboard/orders" className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <span className="text-2xl mb-2">📦</span>
            <span className="text-sm font-medium text-gray-700">View Orders</span>
          </Link>
        </div>
      </div>
    </div>
  )

  const renderConsumerDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Good {getGreeting()}, {user?.fullName || 'Consumer'}! 🛒</h1>
        <p className="text-blue-100">Browse and buy fresh crops from local farmers</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalOrders || 0}</p>
              <p className="text-xs text-green-600 mt-1">Lifetime orders</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Cart Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.cartItems || 0}</p>
              <p className="text-xs text-yellow-600 mt-1">Ready to checkout</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">🛒</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Spent</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">₹{(stats.totalSpent || 0).toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">This month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Favorites</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.favoriteItems || 0}</p>
              <p className="text-xs text-orange-600 mt-1">Saved items</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <span className="text-2xl">❤️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/browse" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <span className="text-2xl mb-2">🌾</span>
            <span className="text-sm font-medium text-gray-700">Browse Crops</span>
          </Link>
          <Link href="/dashboard/cart" className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <span className="text-2xl mb-2">🛒</span>
            <span className="text-sm font-medium text-gray-700">View Cart</span>
          </Link>
          <Link href="/dashboard/orders" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <span className="text-2xl mb-2">📦</span>
            <span className="text-sm font-medium text-gray-700">My Orders</span>
          </Link>
          <Link href="/dashboard/supplies" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <span className="text-2xl mb-2">🧰</span>
            <span className="text-sm font-medium text-gray-700">Farm Supplies</span>
          </Link>
        </div>
      </div>
    </div>
  )

  const renderRecentActivity = () => {
    if (recentActivity.length === 0) return null

    return (
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Recent Activity</h3>
          <Link href="/dashboard/orders" className="text-sm text-blue-600 hover:text-blue-800">
            View all →
          </Link>
        </div>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'purchase' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  <span className="text-lg">
                    {activity.type === 'purchase' ? '🛒' : '💰'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{activity.title}</p>
                  <p className="text-sm text-gray-600">{activity.description}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">₹{activity.amount.toLocaleString()}</p>
                <p className={`text-xs px-2 py-1 rounded-full ${
                  activity.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {activity.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderSupplierDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-lg p-6 text-white">
        <h1 className="text-3xl font-bold mb-2">Good {getGreeting()}, {user?.fullName || 'Supplier'}! 🏪</h1>
        <p className="text-orange-100">Manage your agricultural products and supply business</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalProducts || 0}</p>
              <p className="text-xs text-green-600 mt-1">Active catalog</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <span className="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">₹{(stats.monthlyRevenue || 0).toLocaleString()}</p>
              <p className="text-xs text-blue-600 mt-1">+8% from last month</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <span className="text-2xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Orders</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.pendingOrders || 0}</p>
              <p className="text-xs text-yellow-600 mt-1">Needs processing</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <span className="text-2xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.lowStockItems || 0}</p>
              <p className="text-xs text-purple-600 mt-1">Needs restocking</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <span className="text-2xl">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/dashboard/products/add" className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <span className="text-2xl mb-2">➕</span>
            <span className="text-sm font-medium text-gray-700">Add Product</span>
          </Link>
          <Link href="/dashboard/products" className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <span className="text-2xl mb-2">📦</span>
            <span className="text-sm font-medium text-gray-700">Manage Products</span>
          </Link>
          <Link href="/dashboard/orders" className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <span className="text-2xl mb-2">📋</span>
            <span className="text-sm font-medium text-gray-700">Process Orders</span>
          </Link>
          <Link href="/dashboard/inventory" className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <span className="text-2xl mb-2">📊</span>
            <span className="text-sm font-medium text-gray-700">View Inventory</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders Summary */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Recent Orders</h3>
          <Link href="/dashboard/orders" className="text-sm text-orange-600 hover:text-orange-800">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 3).map((activity, index) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <span className="text-lg">📋</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(activity.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{activity.amount?.toLocaleString()}</p>
                  <p className={`text-xs px-2 py-1 rounded-full ${
                    activity.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {activity.status}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <span className="text-4xl block mb-2">📋</span>
              <p>No recent orders found</p>
              <p className="text-sm">Orders will appear here once customers start placing orders</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            {[
              { name: 'Organic Seeds', sales: 45, revenue: 12500 },
              { name: 'Fertilizers', sales: 32, revenue: 8900 },
              { name: 'Pesticides', sales: 28, revenue: 7600 }
            ].map((product, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.sales} units sold</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{product.revenue.toLocaleString()}</p>
                  <p className="text-xs text-green-600">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Stock Alerts</h3>
          <div className="space-y-3">
            {[
              { name: 'Premium Seeds', stock: 5, status: 'low' },
              { name: 'Organic Fertilizer', stock: 0, status: 'out' },
              { name: 'Plant Protection', stock: 15, status: 'medium' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-sm text-gray-600">{item.stock} units remaining</p>
                </div>
                <div className="text-right">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    item.status === 'out' ? 'bg-red-100 text-red-800' :
                    item.status === 'low' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {item.status === 'out' ? 'Out of Stock' :
                     item.status === 'low' ? 'Low Stock' : 'In Stock'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )

  const renderAdminDashboard = () => (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600">Manage platform users, products, and operations</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">🚜</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Farmers</p>
              <p className="text-2xl font-bold text-gray-900">{stats.farmers || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalProducts || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">📋</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalOrders || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderDashboardContent = () => {
    switch (user.role) {
      case 'farmer':
        return renderFarmerDashboard()
      case 'consumer':
        return renderConsumerDashboard()
      case 'supplier':
        return renderSupplierDashboard()
      case 'admin':
        return renderAdminDashboard()
      default:
        return renderConsumerDashboard()
    }
  }

  return (
    <div className="space-y-6">
      {renderDashboardContent()}
      {renderRecentActivity()}
    </div>
  )
}