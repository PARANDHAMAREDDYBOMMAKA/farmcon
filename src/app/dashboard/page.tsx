'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { dashboardAPI, ordersAPI } from '@/lib/api-client'
import {
  Sunrise, Sun, Sunset, Moon, Sprout, TrendingUp, Package,
  ShoppingCart, Tractor, Heart, DollarSign, CloudSun, Droplets,
  Wind, Zap, Plus, ClipboardList, BarChart3, AlertTriangle,
  Store, Users, Settings, Wheat, Carrot, Box, Briefcase
} from 'lucide-react'
export default function Dashboard() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [weatherData, setWeatherData] = useState<any>(null)

  useEffect(() => {
    if (user && !authLoading) {
      loadDashboardData()
    }

    const statsInterval = setInterval(() => {
      if (user && !authLoading) {
        loadDashboardStats() 
      }
    }, 30000)
    
    return () => clearInterval(statsInterval)
  }, [user, authLoading])

  const loadDashboardData = async () => {
    try {
      if (!user) return

      await loadDashboardStats()

      await loadRecentActivity()

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
    if (hour < 5) return { text: 'Night', icon: <Moon className="w-12 h-12 md:w-16 md:h-16" />, gradient: 'from-indigo-900 via-purple-900 to-blue-900' }
    if (hour < 12) return { text: 'Morning', icon: <Sunrise className="w-12 h-12 md:w-16 md:h-16" />, gradient: 'from-orange-400 via-pink-400 to-purple-500' }
    if (hour < 17) return { text: 'Afternoon', icon: <Sun className="w-12 h-12 md:w-16 md:h-16" />, gradient: 'from-yellow-400 via-orange-400 to-red-400' }
    if (hour < 21) return { text: 'Evening', icon: <Sunset className="w-12 h-12 md:w-16 md:h-16" />, gradient: 'from-purple-600 via-pink-500 to-orange-400' }
    return { text: 'Night', icon: <Moon className="w-12 h-12 md:w-16 md:h-16" />, gradient: 'from-indigo-900 via-purple-900 to-blue-900' }
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

  const renderFarmerDashboard = () => {
    const greeting = getGreeting()
    return (
    <div className="space-y-4 md:space-y-6">
      {}
      <div className={`relative bg-gradient-to-r ${greeting.gradient} rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-xl`}>
        {}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-bounce">{greeting.icon}</div>
              <h1 className="text-2xl md:text-4xl font-bold">Good {greeting.text}, {user?.fullName || 'Farmer'}!</h1>
            </div>
            <p className="text-white/90 text-sm md:text-base">Manage your crops and grow your agricultural business</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
            <Wheat className="w-6 h-6" />
            <span className="text-sm font-medium">Farmer Dashboard</span>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="group relative bg-gradient-to-br from-emerald-500/90 via-green-500/90 to-teal-500/90 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/20">
          {}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-xs text-white">↗</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2 truncate">Active Crops</p>
              <p className="font-extrabold text-white mb-2 break-words leading-tight" style={{ fontSize: `clamp(1.25rem, ${Math.max(1.25, 2.5 - String(stats.activeCrops || 0).length * 0.15)}rem, 2.5rem)` }}>{stats.activeCrops || 0}</p>
              <div className="flex items-center gap-2 text-xs text-white/90">
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full truncate">
                  <span>+2</span>
                  <span className="text-[10px] truncate">this month</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

          {}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                <span>↑</span>
                <span>12%</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Monthly Revenue</p>
              <p className="font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String((stats.totalRevenue || 0).toLocaleString()).length * 0.08)}rem, 2rem)` }}>₹{(stats.totalRevenue || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 truncate">vs last month</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>

          {}
          <div className="absolute top-6 right-6 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full">
                Urgent
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Pending Orders</p>
              <p className="font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String(stats.pendingOrders || 0).length * 0.15)}rem, 2rem)` }}>{stats.pendingOrders || 0}</p>
              <p className="text-xs text-gray-500 truncate">Needs attention</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>

          {}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-purple-100 to-pink-100 rounded-tl-full opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                <Tractor className="w-6 h-6 text-white" />
              </div>
              <div className="text-[10px] text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full">
                RENTAL
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Equipment Listed</p>
              <p className="font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String(stats.equipmentCount || 0).length * 0.15)}rem, 2rem)` }}>{stats.equipmentCount || 0}</p>
              <p className="text-xs text-gray-500 truncate">Active listings</p>
            </div>
          </div>
        </div>
      </div>

      {}
      {weatherData && (
        <div className="relative bg-gradient-to-br from-blue-500/90 via-blue-600/90 to-cyan-600/90 backdrop-blur-xl rounded-3xl shadow-2xl p-6 md:p-8 overflow-hidden border border-white/20">
          {}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300/20 rounded-full blur-2xl"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/30 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg">
                  <CloudSun className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-white">Weather Forecast</h3>
              </div>
              <a href="/dashboard/weather" className="text-xs md:text-sm text-white/90 hover:text-white bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-full transition-all duration-300 shadow-lg">
                View Details →
              </a>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-white/20 backdrop-blur-md rounded-2xl p-5 md:p-6 border border-white/30 shadow-xl">
                  <p className="text-white/80 text-sm mb-2">{weatherData.location}</p>
                  <div className="text-5xl md:text-6xl font-extrabold text-white mb-2">{weatherData.temperature}°C</div>
                  <p className="text-white/90 text-lg mb-4">{weatherData.condition}</p>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30 shadow-md">
                      <p className="text-white/70 text-xs mb-1 flex items-center gap-1"><Droplets className="w-3 h-3" /> Humidity</p>
                      <p className="font-bold text-white text-lg">{weatherData.humidity}%</p>
                    </div>
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 border border-white/30 shadow-md">
                      <p className="text-white/70 text-xs mb-1 flex items-center gap-1"><Wind className="w-3 h-3" /> Wind</p>
                      <p className="font-bold text-white text-lg">{weatherData.windSpeed} km/h</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <h5 className="font-semibold text-white/90 mb-4 text-sm md:text-base">3-Day Forecast</h5>
                <div className="grid grid-cols-3 gap-3 md:gap-4">
                  {weatherData.forecast.map((day: any, index: number) => (
                    <div key={index} className="bg-white/20 backdrop-blur-md border border-white/30 rounded-2xl p-4 md:p-5 hover:bg-white/30 transition-all duration-300 shadow-lg">
                      <p className="text-sm md:text-base font-semibold text-white mb-1">{day.day}</p>
                      <p className="text-xs text-white/80 mb-3">{day.condition}</p>
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg md:text-xl font-bold text-white">{day.high}°</span>
                        <span className="text-sm text-white/70">{day.low}°</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Link href="/dashboard/crops/add" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Sprout className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">Add Crop</span>
          </Link>
          <Link href="/dashboard/sell" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <DollarSign className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">Create Listing</span>
          </Link>
          <Link href="/dashboard/equipment/add" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Tractor className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">List Equipment</span>
          </Link>
          <Link href="/dashboard/orders" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Package className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">View Orders</span>
          </Link>
        </div>
      </div>
    </div>
    )
  }

  const renderConsumerDashboard = () => {
    const greeting = getGreeting()
    return (
    <div className="space-y-4 md:space-y-6">
      {}
      <div className={`relative bg-gradient-to-r ${greeting.gradient} rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-xl`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-bounce">{greeting.icon}</div>
              <h1 className="text-2xl md:text-4xl font-bold">Good {greeting.text}, {user?.fullName || 'Consumer'}!</h1>
            </div>
            <p className="text-white/90 text-sm md:text-base">Browse and buy fresh crops from local farmers</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
            <ShoppingCart className="w-6 h-6" />
            <span className="text-sm font-medium">Consumer Dashboard</span>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="group relative bg-gradient-to-br from-green-500/90 via-emerald-500/90 to-teal-500/90 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/20">
          {}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-xs text-white">↗</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2 truncate">Total Orders</p>
              <p className="font-extrabold text-white mb-2 break-words leading-tight" style={{ fontSize: `clamp(1.25rem, ${Math.max(1.25, 2.5 - String(stats.totalOrders || 0).length * 0.15)}rem, 2.5rem)` }}>{stats.totalOrders || 0}</p>
              <div className="flex items-center gap-2 text-xs text-white/90">
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full truncate">
                  <span className="text-[10px] truncate">Lifetime orders</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-500 to-orange-500"></div>

          {}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-yellow-100 to-orange-100 rounded-full opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs text-yellow-700 font-medium bg-yellow-50 px-2 py-1 rounded-full">
                <span>Ready</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Cart Items</p>
              <p className="font-extrabold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String(stats.cartItems || 0).length * 0.15)}rem, 2rem)` }}>{stats.cartItems || 0}</p>
              <p className="text-xs text-gray-500 truncate">Ready to checkout</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

          {}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-100 to-cyan-100 rounded-tl-full opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                <span>↑</span>
                <span>15%</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Total Spent</p>
              <p className="font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String((stats.totalSpent || 0).toLocaleString()).length * 0.08)}rem, 2rem)` }}>₹{(stats.totalSpent || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 truncate">This month</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pink-500 to-rose-500"></div>

          {}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div className="text-[10px] text-pink-600 font-medium bg-pink-50 px-2 py-1 rounded-full">
                SAVED
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Favorites</p>
              <p className="font-extrabold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String(stats.favoriteItems || 0).length * 0.15)}rem, 2rem)` }}>{stats.favoriteItems || 0}</p>
              <p className="text-xs text-gray-500 truncate">Saved items</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Link href="/dashboard/browse" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Wheat className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">Browse Crops</span>
          </Link>
          <Link href="/dashboard/cart" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">View Cart</span>
          </Link>
          <Link href="/dashboard/orders" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Package className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">My Orders</span>
          </Link>
          <Link href="/dashboard/supplies" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Briefcase className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">Farm Supplies</span>
          </Link>
        </div>
      </div>
    </div>
    )
  }

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
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-full ${
                  activity.type === 'purchase' ? 'bg-blue-100' : 'bg-green-100'
                }`}>
                  {activity.type === 'purchase' ?
                    <ShoppingCart className="w-5 h-5 text-blue-600" /> :
                    <DollarSign className="w-5 h-5 text-green-600" />
                  }
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

  const renderSupplierDashboard = () => {
    const greeting = getGreeting()
    return (
    <div className="space-y-4 md:space-y-6">
      {}
      <div className={`relative bg-gradient-to-r ${greeting.gradient} rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-xl`}>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-bounce">{greeting.icon}</div>
              <h1 className="text-2xl md:text-4xl font-bold">Good {greeting.text}, {user?.fullName || 'Supplier'}!</h1>
            </div>
            <p className="text-white/90 text-sm md:text-base">Manage your agricultural products and supply business</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
            <Store className="w-6 h-6" />
            <span className="text-sm font-medium">Supplier Dashboard</span>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="group relative bg-gradient-to-br from-green-500/90 via-emerald-500/90 to-teal-500/90 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/20">
          {}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-xs text-white">↗</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2 truncate">Total Products</p>
              <p className="font-extrabold text-white mb-2 break-words leading-tight" style={{ fontSize: `clamp(1.25rem, ${Math.max(1.25, 2.5 - String(stats.totalProducts || 0).length * 0.15)}rem, 2.5rem)` }}>{stats.totalProducts || 0}</p>
              <div className="flex items-center gap-2 text-xs text-white/90">
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full truncate">
                  <span className="text-[10px] truncate">Active catalog</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

          {}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                <span>↑</span>
                <span>8%</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Monthly Revenue</p>
              <p className="font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String((stats.monthlyRevenue || 0).toLocaleString()).length * 0.08)}rem, 2rem)` }}>₹{(stats.monthlyRevenue || 0).toLocaleString()}</p>
              <p className="text-xs text-gray-500 truncate">vs last month</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>

          {}
          <div className="absolute top-6 right-6 w-3 h-3 bg-amber-500 rounded-full animate-pulse"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div className="text-xs text-amber-600 font-semibold bg-amber-50 px-3 py-1 rounded-full">
                Urgent
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Pending Orders</p>
              <p className="font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String(stats.pendingOrders || 0).length * 0.15)}rem, 2rem)` }}>{stats.pendingOrders || 0}</p>
              <p className="text-xs text-gray-500 truncate">Needs processing</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>

          {}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-purple-100 to-pink-100 rounded-tl-full opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div className="text-[10px] text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full">
                ALERT
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Low Stock Items</p>
              <p className="font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String(stats.lowStockItems || 0).length * 0.15)}rem, 2rem)` }}>{stats.lowStockItems || 0}</p>
              <p className="text-xs text-gray-500 truncate">Needs restocking</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-md">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">Quick Actions</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Link href="/dashboard/products/add" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Plus className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">Add Product</span>
          </Link>
          <Link href="/dashboard/products" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Package className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">Manage Products</span>
          </Link>
          <Link href="/dashboard/orders" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">Process Orders</span>
          </Link>
          <Link href="/dashboard/inventory" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">View Inventory</span>
          </Link>
        </div>
      </div>

      {}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900">Recent Orders</h3>
          <Link href="/dashboard/orders" className="text-sm text-orange-600 hover:text-orange-800">
            View all →
          </Link>
        </div>
        <div className="space-y-3">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 3).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <ClipboardList className="w-5 h-5 text-orange-600" />
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
              <ClipboardList className="w-10 h-10 mx-auto mb-2" />
              <p>No recent orders found</p>
              <p className="text-sm">Orders will appear here once customers start placing orders</p>
            </div>
          )}
        </div>
      </div>

      {}
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
  }

  const renderAdminDashboard = () => {
    const greeting = getGreeting()
    return (
    <div className="space-y-4 md:space-y-6">
      {}
      <div className={`relative bg-gradient-to-r ${greeting.gradient} rounded-2xl p-6 md:p-8 text-white overflow-hidden shadow-xl`}>
        {}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-32 h-32 md:w-64 md:h-64 bg-white rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 md:w-48 md:h-48 bg-white rounded-full translate-y-12 -translate-x-12"></div>
        </div>
        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-bounce">{greeting.icon}</div>
              <h1 className="text-2xl md:text-4xl font-bold">Good {greeting.text}, {user?.fullName || 'Admin'}!</h1>
            </div>
            <p className="text-white/90 text-sm md:text-base">Manage platform users, products, and operations</p>
          </div>
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-4 py-2">
            <Settings className="w-6 h-6" />
            <span className="text-sm font-medium">Admin Dashboard</span>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="group relative bg-gradient-to-br from-green-500/90 via-emerald-500/90 to-teal-500/90 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/20">
          {}
          <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-5 -left-5 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="text-xs text-white">↗</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-white/80 uppercase tracking-wider mb-2 truncate">Total Users</p>
              <p className="font-extrabold text-white mb-2 break-words leading-tight" style={{ fontSize: `clamp(1.25rem, ${Math.max(1.25, 2.5 - String(stats.totalUsers || 0).length * 0.15)}rem, 2.5rem)` }}>{stats.totalUsers || 0}</p>
              <div className="flex items-center gap-2 text-xs text-white/90">
                <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-sm px-2 py-1 rounded-full truncate">
                  <span>+12</span>
                  <span className="text-[10px] truncate">this month</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-cyan-500"></div>

          {}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-full opacity-30 group-hover:opacity-50 group-hover:scale-110 transition-all duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-md">
                <Tractor className="w-6 h-6 text-white" />
              </div>
              <div className="flex items-center gap-1 text-xs text-green-600 font-medium bg-green-50 px-2 py-1 rounded-full">
                <span>↑</span>
                <span>8%</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Farmers</p>
              <p className="font-extrabold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String(stats.farmers || 0).length * 0.15)}rem, 2rem)` }}>{stats.farmers || 0}</p>
              <p className="text-xs text-gray-500 truncate">Active farmers</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>

          {}
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-amber-100 to-orange-100 rounded-tl-full opacity-40 group-hover:opacity-60 transition-opacity duration-500"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-md">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div className="text-[10px] text-amber-600 font-medium bg-amber-50 px-2 py-1 rounded-full">
                CATALOG
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Total Products</p>
              <p className="font-extrabold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String(stats.totalProducts || 0).length * 0.15)}rem, 2rem)` }}>{stats.totalProducts || 0}</p>
              <p className="text-xs text-gray-500 truncate">Platform-wide</p>
            </div>
          </div>
        </div>

        <div className="group relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-5 md:p-6 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden border border-white/40">
          {}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-pink-500"></div>

          {}
          <div className="absolute top-6 right-6 w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>

          <div className="relative">
            <div className="flex items-center justify-between mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div className="text-[10px] text-purple-600 font-medium bg-purple-50 px-2 py-1 rounded-full">
                ORDERS
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 truncate">Total Orders</p>
              <p className="font-extrabold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2 break-words leading-tight" style={{ fontSize: `clamp(1rem, ${Math.max(1, 2 - String(stats.totalOrders || 0).length * 0.15)}rem, 2rem)` }}>{stats.totalOrders || 0}</p>
              <p className="text-xs text-gray-500 truncate">All transactions</p>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl p-6 md:p-8 border border-white/40">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-gray-900">Admin Tools</h3>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          <Link href="/dashboard/admin/users" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Users className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">Manage Users</span>
          </Link>
          <Link href="/dashboard/admin/products" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <Package className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">Manage Products</span>
          </Link>
          <Link href="/dashboard/admin/orders" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <ClipboardList className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">View Orders</span>
          </Link>
          <Link href="/dashboard/admin/analytics" className="group relative flex flex-col items-center p-5 md:p-6 bg-gradient-to-br from-amber-500 to-orange-500 rounded-2xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-500">
              <BarChart3 className="w-8 h-8 text-white" />
            </div>
            <span className="relative text-sm md:text-base font-bold text-white text-center">Analytics</span>
          </Link>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/40">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Platform Health
          </h3>
          <div className="space-y-3">
            {[
              { label: 'System Status', value: 'Operational', status: 'success' },
              { label: 'Active Sessions', value: '1,247', status: 'success' },
              { label: 'Server Load', value: '45%', status: 'warning' }
            ].map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{item.label}</span>
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  item.status === 'success' ? 'bg-green-100 text-green-800' :
                  item.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/40">
          <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recent Alerts
          </h3>
          <div className="space-y-3">
            {[
              { message: 'New user registration spike', time: '2 hours ago', type: 'info' },
              { message: 'Low stock alert for 5 items', time: '4 hours ago', type: 'warning' },
              { message: 'Database backup completed', time: '6 hours ago', type: 'success' }
            ].map((alert, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className={`w-2 h-2 rounded-full mt-2 ${
                  alert.type === 'success' ? 'bg-green-500' :
                  alert.type === 'warning' ? 'bg-yellow-500' :
                  'bg-blue-500'
                }`}></div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
    )
  }

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