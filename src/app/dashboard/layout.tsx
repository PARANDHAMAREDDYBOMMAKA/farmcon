'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { profileAPI } from '@/lib/api-client'
import NotificationBell from '@/components/notifications/NotificationBell'
import ToastProvider from '@/components/providers/ToastProvider'
import type { User } from '@/types'

const navigation = {
  farmer: [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'My Crops', href: '/dashboard/crops', icon: '🌱' },
    // { name: 'Sell Crops', href: '/dashboard/sell', icon: '💰' },
    { name: 'Buy Supplies', href: '/dashboard/supplies', icon: '🛒' },
    { name: 'Equipment Rental', href: '/dashboard/equipment', icon: '🚜' },
    { name: 'Orders', href: '/dashboard/orders', icon: '📦' },
    { name: 'Weather', href: '/dashboard/weather', icon: '🌤️' },
    { name: 'Market Prices', href: '/dashboard/market-prices', icon: '📊' },
  ],
  consumer: [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Browse Crops', href: '/dashboard/browse', icon: '🥕' },
    { name: 'My Orders', href: '/dashboard/orders', icon: '📦' },
    { name: 'Cart', href: '/dashboard/cart', icon: '🛒' },
    { name: 'Weather', href: '/dashboard/weather', icon: '🌤️' },
    { name: 'Market Prices', href: '/dashboard/market-prices', icon: '📊' },
  ],
  supplier: [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'My Products', href: '/dashboard/products', icon: '📦' },
    { name: 'Orders', href: '/dashboard/orders', icon: '📋' },
    { name: 'Inventory', href: '/dashboard/inventory', icon: '📊' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: '📈' },
    { name: 'Weather', href: '/dashboard/weather', icon: '🌤️' },
    { name: 'Market Prices', href: '/dashboard/market-prices', icon: '📊' },
    { name: 'Competitor Analysis', href: '/dashboard/competitor-analysis', icon: '🔍' },
  ],
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { name: 'Users', href: '/dashboard/users', icon: '👥' },
    { name: 'Products', href: '/dashboard/all-products', icon: '📦' },
    { name: 'Orders', href: '/dashboard/all-orders', icon: '📋' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: '📊' },
    { name: 'Weather', href: '/dashboard/weather', icon: '🌤️' },
    { name: 'Market Prices', href: '/dashboard/market-prices', icon: '📊' },
    { name: 'Competitor Analysis', href: '/dashboard/competitor-analysis', icon: '🔍' },
    { name: 'Settings', href: '/dashboard/settings', icon: '⚙️' },
  ]
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/auth/signin')
          return
        }

        // Get user profile using our API
        try {
          const profile = await profileAPI.getProfile(session.user.id)
          if (!profile) {
            // If profile doesn't exist, redirect to signin
            router.push('/auth/signin?message=Profile not found. Please sign in again.')
            return
          }
          setUser(profile)
        } catch (error) {
          console.error('Profile fetch error:', error)
          // If profile doesn't exist, redirect to signin
          router.push('/auth/signin?message=Error loading profile. Please sign in again.')
          return
        }
      } catch (error) {
        console.error('Error fetching user data:', error)
        router.push('/auth/signin')
      } finally {
        setLoading(false)
      }
    }

    getProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        router.push('/')
      }
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userNavigation = navigation[user.role] || navigation.consumer

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:fixed lg:inset-y-0 lg:left-0 lg:shadow-xl overflow-y-auto flex flex-col`}>
        {/* Enhanced Header */}
        <div className="flex-shrink-0 relative h-20 px-6 bg-gradient-to-br from-green-600 via-green-700 to-emerald-700 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-32 h-32 bg-white rounded-full -translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-white rounded-full translate-x-12 translate-y-12"></div>
          </div>

          <div className="relative flex items-center justify-between h-full">
            <Link href="/" className="group flex items-center space-x-3 text-white hover:text-green-100 transition-all duration-200">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                <span className="text-xl">🌱</span>
              </div>
              <div>
                <div className="text-xl font-bold">FarmCon</div>
                <div className="text-xs opacity-80">Agricultural Platform</div>
              </div>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-white hover:text-green-100 hover:bg-white/10 rounded-lg transition-all duration-200"
            >
              <span className="text-xl">×</span>
            </button>
          </div>
        </div>

        {/* Role Badge */}
        <div className="flex-shrink-0 px-6 py-4">
          <div className="relative overflow-hidden bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-3">
            <div className="absolute top-0 right-0 w-16 h-16 bg-green-100 rounded-full -translate-y-8 translate-x-8 opacity-50"></div>
            <div className="relative flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {user.role === 'farmer' ? '🌾' : user.role === 'consumer' ? '🛒' : user.role === 'supplier' ? '📦' : '👑'}
                </span>
              </div>
              <div>
                <div className="text-sm font-bold text-green-700 capitalize">{user.role}</div>
                <div className="text-xs text-green-600">Dashboard</div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Navigation */}
        <nav className="flex-1 px-4 pb-4 overflow-y-auto">
          <div className="space-y-1">
            {userNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="group flex items-center px-4 py-3 text-gray-700 hover:text-green-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-200 hover:shadow-sm hover:scale-[1.02] transform"
              >
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 group-hover:bg-green-100 rounded-lg transition-all duration-200 group-hover:scale-110">
                  <span className="text-lg group-hover:scale-110 transition-transform duration-200">{item.icon}</span>
                </div>
                <span className="ml-4 font-medium group-hover:font-semibold transition-all duration-200">{item.name}</span>
                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-green-500">→</span>
                </div>
              </Link>
            ))}
          </div>
        </nav>

        {/* Enhanced User Profile Section */}
        <div className="flex-shrink-0 p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="relative overflow-hidden bg-white rounded-xl p-4 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full -translate-y-10 translate-x-10 opacity-30"></div>

            <div className="relative flex items-center space-x-3 mb-3">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white text-lg font-bold">
                    {user.fullName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">
                  {user.fullName?.split(' ').map(name =>
                    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
                  ).join(' ') || 'User'}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <div className="flex items-center mt-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                  <span className="text-xs text-green-600 font-medium">Online</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center justify-center space-x-2 text-sm text-gray-600 hover:text-red-600 font-medium transition-all duration-200 px-3 py-2 rounded-lg hover:bg-red-50 group"
            >
              <span className="group-hover:scale-110 transition-transform duration-200">🚪</span>
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 lg:ml-72">
        {/* Top bar */}
        <div className="shadow-lg border-b border-gray-200 backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <span className="text-xl">☰</span>
            </button>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 font-medium">
                Welcome back, <span className="text-green-600 font-semibold">
                  {user.fullName?.split(' ').map(name =>
                    name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
                  ).join(' ') || 'User'}
                </span>! 👋
              </div>
              <NotificationBell />
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Toast Provider */}
      <ToastProvider />
    </div>
  )
}