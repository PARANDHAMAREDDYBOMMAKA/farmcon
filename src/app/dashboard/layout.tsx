'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { profileAPI } from '@/lib/api-client'
import NotificationBell, { NotificationBellRef } from '@/components/notifications/NotificationBell'
import ToastProvider from '@/components/providers/ToastProvider'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { ElevenLabsSidebarWidget } from '@/components/ElevenLabsWidget'
import type { User } from '@/types'
import {
  Home, Sprout, ShoppingCart, Tractor, Package,
  CloudSun, TrendingUp, Carrot,
  ClipboardList, BarChart3, Search, Settings,
  Users, X, Menu, LogOut, Wheat, Store,
  ChevronRight, Sparkles
} from 'lucide-react'

const iconMap: Record<string, any> = {
  Home, Sprout, ShoppingCart, Tractor, Package,
  CloudSun, TrendingUp, Carrot,
  ClipboardList, BarChart3, Search, Settings,
  Users, Wheat, Store
}

const getIcon = (iconName: string, className: string = "w-5 h-5") => {
  const IconComponent = iconMap[iconName]
  return IconComponent ? <IconComponent className={className} /> : null
}

const navigation = {
  farmer: [
    { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { name: 'My Crops', href: '/dashboard/crops', icon: 'Sprout' },
    { name: 'Buy Supplies', href: '/dashboard/supplies', icon: 'ShoppingCart' },
    { name: 'Equipment Rental', href: '/dashboard/equipment', icon: 'Tractor' },
    { name: 'Orders', href: '/dashboard/orders', icon: 'Package' },
    { name: 'Weather', href: '/dashboard/weather', icon: 'CloudSun' },
    { name: 'Market Prices', href: '/dashboard/market-prices', icon: 'TrendingUp' },
  ],
  consumer: [
    { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { name: 'Browse Crops', href: '/dashboard/browse', icon: 'Carrot' },
    { name: 'My Orders', href: '/dashboard/orders', icon: 'Package' },
    { name: 'Cart', href: '/dashboard/cart', icon: 'ShoppingCart' },
    { name: 'Weather', href: '/dashboard/weather', icon: 'CloudSun' },
    { name: 'Market Prices', href: '/dashboard/market-prices', icon: 'TrendingUp' },
  ],
  supplier: [
    { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { name: 'My Products', href: '/dashboard/products', icon: 'Package' },
    { name: 'Orders', href: '/dashboard/orders', icon: 'ClipboardList' },
    { name: 'Inventory', href: '/dashboard/inventory', icon: 'BarChart3' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: 'TrendingUp' },
    { name: 'Weather', href: '/dashboard/weather', icon: 'CloudSun' },
    { name: 'Market Prices', href: '/dashboard/market-prices', icon: 'TrendingUp' },
    { name: 'Competitor Analysis', href: '/dashboard/competitor-analysis', icon: 'Search' },
  ],
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { name: 'Users', href: '/dashboard/users', icon: 'Users' },
    { name: 'Products', href: '/dashboard/all-products', icon: 'Package' },
    { name: 'Orders', href: '/dashboard/all-orders', icon: 'ClipboardList' },
    { name: 'Analytics', href: '/dashboard/analytics', icon: 'BarChart3' },
    { name: 'Weather', href: '/dashboard/weather', icon: 'CloudSun' },
    { name: 'Market Prices', href: '/dashboard/market-prices', icon: 'TrendingUp' },
    { name: 'Competitor Analysis', href: '/dashboard/competitor-analysis', icon: 'Search' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'Settings' },
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
  const pathname = usePathname()
  const notificationBellRef = useRef<NotificationBellRef>(null)
  const router = useRouter()

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
          router.push('/auth/signin')
          return
        }

        try {
          const profile = await profileAPI.getProfile(session.user.id)
          if (!profile) {
            router.push('/auth/signin?message=Profile not found. Please sign in again.')
            return
          }
          setUser(profile)
        } catch (error) {
          console.error('Profile fetch error:', error)
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-14 h-14 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <Sprout className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
          </div>
          <p className="mt-4 text-emerald-700 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const userNavigation = navigation[user.role] || navigation.consumer

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/40">
      <aside className={`
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        fixed inset-y-0 left-0 z-50 w-[280px]
        bg-gradient-to-b from-emerald-900 via-emerald-950 to-teal-950
        transform transition-transform duration-300 ease-out
        lg:translate-x-0 flex flex-col shadow-2xl shadow-emerald-900/30
      `}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-emerald-800/50">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover:shadow-emerald-400/60 transition-all duration-300 group-hover:scale-105">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-xl text-white">FarmCon</span>
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider">Premium</span>
              </div>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 backdrop-blur-sm">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/30">
              {user.role === 'farmer' ? '🌾' :
               user.role === 'consumer' ? '🛒' :
               user.role === 'supplier' ? '📦' : '⚙️'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white capitalize">{user.role}</p>
              <p className="text-sm text-emerald-300">Active Account</p>
            </div>
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-lg shadow-emerald-400/60"></div>
          </div>
        </div>

        <div className="px-4 mb-4">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-400/40 transition-all text-white/60 hover:text-white group">
            <Search className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300" />
            <span className="text-sm font-medium">Quick search...</span>
            <kbd className="ml-auto px-2 py-1 text-[10px] font-semibold bg-emerald-500/20 rounded-md border border-emerald-500/30 text-emerald-300">⌘K</kbd>
          </button>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-700">
          <div className="space-y-1">
            {userNavigation.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    setSidebarOpen(false)
                    notificationBellRef.current?.closeDropdown()
                  }}
                  className={`
                    group flex items-center gap-3 px-4 py-3 rounded-xl
                    transition-all duration-200 relative overflow-hidden
                    ${active
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/40'
                      : 'text-emerald-100/80 hover:text-white hover:bg-white/10'
                    }
                  `}
                >
                  {active && (
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent"></div>
                  )}
                  <span className={`relative ${active ? 'text-white' : 'text-emerald-400 group-hover:text-emerald-300'} transition-colors`}>
                    {getIcon(item.icon)}
                  </span>
                  <span className="relative text-sm font-semibold">{item.name}</span>
                  {active && (
                    <ChevronRight className="w-4 h-4 ml-auto relative" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        <div className="px-4 py-4 border-t border-emerald-800/50">
          <ElevenLabsSidebarWidget />
        </div>

        <div className="p-4 border-t border-emerald-800/50 bg-black/20">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group"
          >
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-emerald-500/30">
                {user.fullName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-emerald-950 shadow-lg shadow-emerald-400/50"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                {user.fullName?.split(' ').map(name =>
                  name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()
                ).join(' ') || 'User'}
              </p>
              <p className="text-xs text-emerald-400/80 truncate">{user.email}</p>
            </div>
          </Link>

          <button
            onClick={handleSignOut}
            className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold text-rose-300 hover:text-rose-200 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-40 h-16 bg-white/90 backdrop-blur-xl border-b border-emerald-100 shadow-sm">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <span className="text-emerald-600 font-medium">Welcome back,</span>
                <span className="font-bold text-emerald-900">
                  {user.fullName?.split(' ')[0] || 'User'}
                </span>
                <span className="text-2xl">👋</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <NotificationBell ref={notificationBellRef} />
            </div>
          </div>
        </header>

        <main
          className="p-4 sm:p-6 lg:p-8"
          onClick={() => notificationBellRef.current?.closeDropdown()}
        >
          <div className="max-w-7xl mx-auto">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <ToastProvider />
    </div>
  )
}
