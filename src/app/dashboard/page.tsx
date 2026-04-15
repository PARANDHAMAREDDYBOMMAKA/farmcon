'use client'

import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  BarChart3,
  Box,
  Carrot,
  ClipboardList,
  CloudSun,
  DollarSign,
  Heart,
  Package,
  Plus,
  Settings,
  ShoppingCart,
  Sprout,
  Store,
  Tractor,
  TrendingUp,
  Users,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { dashboardAPI, ordersAPI } from '@/lib/api-client'
import {
  GreetingHero,
  QuickActions,
  RecentActivity,
  StatCard,
  WeatherCard,
  type Activity,
  type QuickAction,
  type WeatherCardData,
} from '@/components/dashboard'
import { Badge } from '@/components/ui/badge'

type Stats = Record<string, number | undefined>

function inr(n?: number) {
  return `₹${(n || 0).toLocaleString('en-IN')}`
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<Stats>({})
  const [loading, setLoading] = useState(true)
  const [activity, setActivity] = useState<Activity[]>([])
  const [weather, setWeather] = useState<WeatherCardData | null>(null)

  useEffect(() => {
    if (!user || authLoading) return

    loadAll()
    const timer = setInterval(() => {
      loadStats().catch(() => {})
    }, 30000)
    return () => clearInterval(timer)
  }, [user, authLoading])

  const loadAll = async () => {
    try {
      await Promise.all([loadStats(), loadActivity(), user?.role === 'farmer' ? loadWeather() : Promise.resolve()])
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    if (!user) return
    try {
      const s = await dashboardAPI.getStats(user.id, user.role)
      setStats(s || {})
    } catch (err) {
      console.error('Failed to load stats:', err)
      setStats({})
    }
  }

  const loadActivity = async () => {
    if (!user) return
    try {
      const [customerOrders, sellerOrders] = await Promise.all([
        ordersAPI.getOrders(user.id, 'customer').catch(() => []),
        ordersAPI.getOrders(user.id, 'seller').catch(() => []),
      ])

      const merged: Activity[] = [
        ...(customerOrders || []).slice(0, 3).map((o: any) => ({
          id: o.id,
          type: 'purchase' as const,
          title: `Order #${String(o.id).slice(-8)}`,
          description: o.seller?.full_name
            ? `Purchased from ${o.seller.full_name}`
            : 'Purchase',
          amount: Number(o.total_amount || 0),
          date: o.created_at,
          status: String(o.status || 'pending'),
        })),
        ...(sellerOrders || []).slice(0, 3).map((o: any) => ({
          id: o.id,
          type: 'sale' as const,
          title: `Sale #${String(o.id).slice(-8)}`,
          description: o.customer?.full_name ? `Sold to ${o.customer.full_name}` : 'Sale',
          amount: Number(o.total_amount || 0),
          date: o.created_at,
          status: String(o.status || 'pending'),
        })),
      ]

      merged.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      setActivity(merged.slice(0, 5))
    } catch (err) {
      console.error('Failed to load activity:', err)
      setActivity([])
    }
  }

  const loadWeather = async () => {
    if (!user) return
    try {
      const location =
        user.city && user.state ? `${user.city}, ${user.state}` : user.city || 'New Delhi, India'
      const res = await fetch(`/api/weather?location=${encodeURIComponent(location)}`)
      const data = await res.json()
      if (data?.weather) {
        setWeather({
          location: data.weather.location,
          temperature: Math.round(data.weather.temperature),
          condition: data.weather.condition,
          humidity: data.weather.humidity,
          windSpeed: data.weather.windSpeed,
          forecast: (data.weather.forecast || []).slice(0, 3).map((f: any) => ({
            day: f.date,
            high: Math.round(f.high),
            low: Math.round(f.low),
            condition: f.condition,
          })),
        })
      }
    } catch (err) {
      console.error('Failed to load weather:', err)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-emerald-200 border-t-emerald-500 rounded-full mx-auto" />
          <p className="mt-4 text-sm font-semibold text-emerald-700">Loading your dashboard…</p>
        </div>
      </div>
    )
  }
  if (!user) return null

  const name = user.fullName?.split(' ')[0] || 'there'
  const role = (user.role as 'farmer' | 'consumer' | 'supplier' | 'admin') || 'consumer'

  return (
    <div className="space-y-6">
      <GreetingHero
        name={name}
        role={role}
        rightSlot={
          <div className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-sm ring-1 ring-white/25 px-3.5 py-2 text-xs font-bold uppercase tracking-wider">
            <RoleIcon role={role} />
            {role} workspace
          </div>
        }
      />

      {role === 'farmer' && <FarmerStats stats={stats} />}
      {role === 'consumer' && <ConsumerStats stats={stats} />}
      {role === 'supplier' && <SupplierStats stats={stats} />}
      {role === 'admin' && <AdminStats stats={stats} />}

      {role === 'farmer' && weather && <WeatherCard data={weather} />}

      <QuickActions actions={actionsByRole[role]} />

      <RecentActivity items={activity} />
    </div>
  )
}

function RoleIcon({ role }: { role: 'farmer' | 'consumer' | 'supplier' | 'admin' }) {
  const Icon =
    role === 'farmer' ? Sprout : role === 'supplier' ? Store : role === 'admin' ? Settings : ShoppingCart
  return <Icon className="w-4 h-4" />
}

function FarmerStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Active crops"
        value={stats.activeCrops ?? 0}
        icon={Sprout}
        tone="emerald"
        hint="Currently growing"
        trend={stats.activeCrops ? { value: '+2 this month', direction: 'up' } : undefined}
      />
      <StatCard
        label="Monthly revenue"
        value={inr(stats.totalRevenue)}
        icon={DollarSign}
        tone="sky"
        hint="vs last month"
        trend={stats.totalRevenue ? { value: '+12%', direction: 'up' } : undefined}
      />
      <StatCard
        label="Pending orders"
        value={stats.pendingOrders ?? 0}
        icon={Package}
        tone="amber"
        hint="Needs action"
      />
      <StatCard
        label="Equipment listed"
        value={stats.equipmentCount ?? 0}
        icon={Tractor}
        tone="violet"
        hint="Active listings"
      />
    </div>
  )
}

function ConsumerStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total orders"
        value={stats.totalOrders ?? 0}
        icon={Package}
        tone="emerald"
        hint="Lifetime orders"
      />
      <StatCard
        label="Cart items"
        value={stats.cartItems ?? 0}
        icon={ShoppingCart}
        tone="amber"
        hint="Ready to checkout"
      />
      <StatCard
        label="Total spent"
        value={inr(stats.totalSpent)}
        icon={DollarSign}
        tone="sky"
        hint="On fresh produce"
      />
      <StatCard
        label="Favorites"
        value={stats.favoriteItems ?? 0}
        icon={Heart}
        tone="rose"
        hint="Saved listings"
      />
    </div>
  )
}

function SupplierStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Products"
        value={stats.totalProducts ?? 0}
        icon={Box}
        tone="emerald"
        hint="In catalog"
      />
      <StatCard
        label="Monthly revenue"
        value={inr(stats.monthlyRevenue)}
        icon={DollarSign}
        tone="sky"
        hint="This month"
        trend={stats.monthlyRevenue ? { value: '+8%', direction: 'up' } : undefined}
      />
      <StatCard
        label="Pending orders"
        value={stats.pendingOrders ?? 0}
        icon={ClipboardList}
        tone="amber"
        hint="Awaiting fulfillment"
      />
      <StatCard
        label="Low stock"
        value={stats.lowStockItems ?? 0}
        icon={AlertTriangle}
        tone="rose"
        hint="Needs reorder"
      />
    </div>
  )
}

function AdminStats({ stats }: { stats: Stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        label="Total users"
        value={stats.totalUsers ?? 0}
        icon={Users}
        tone="emerald"
        hint="All roles"
      />
      <StatCard
        label="Farmers"
        value={stats.farmers ?? 0}
        icon={Sprout}
        tone="teal"
        hint="Verified + active"
      />
      <StatCard
        label="GMV"
        value={inr(stats.totalRevenue)}
        icon={BarChart3}
        tone="sky"
        hint="All-time"
      />
      <StatCard
        label="Total orders"
        value={stats.totalOrders ?? 0}
        icon={Package}
        tone="violet"
        hint="Platform-wide"
      />
    </div>
  )
}

const actionsByRole: Record<'farmer' | 'consumer' | 'supplier' | 'admin', QuickAction[]> = {
  farmer: [
    { label: 'Add crop', href: '/dashboard/crops/add', icon: Plus, tone: 'emerald' },
    { label: 'Create listing', href: '/dashboard/sell', icon: DollarSign, tone: 'sky' },
    { label: 'List equipment', href: '/dashboard/equipment/add', icon: Tractor, tone: 'violet' },
    { label: 'View orders', href: '/dashboard/orders', icon: Package, tone: 'amber' },
  ],
  consumer: [
    { label: 'Browse crops', href: '/dashboard/browse', icon: Carrot, tone: 'emerald' },
    { label: 'View cart', href: '/dashboard/cart', icon: ShoppingCart, tone: 'amber' },
    { label: 'My orders', href: '/dashboard/orders', icon: Package, tone: 'sky' },
    { label: 'Farm supplies', href: '/dashboard/supplies', icon: Store, tone: 'violet' },
  ],
  supplier: [
    { label: 'Add product', href: '/dashboard/products', icon: Plus, tone: 'emerald' },
    { label: 'View orders', href: '/dashboard/orders', icon: ClipboardList, tone: 'amber' },
    { label: 'Inventory', href: '/dashboard/inventory', icon: Box, tone: 'sky' },
    { label: 'Weather', href: '/dashboard/weather', icon: CloudSun, tone: 'violet' },
  ],
  admin: [
    { label: 'Users', href: '/dashboard/users', icon: Users, tone: 'emerald' },
    { label: 'All orders', href: '/dashboard/all-orders', icon: ClipboardList, tone: 'sky' },
    { label: 'Weather', href: '/dashboard/weather', icon: CloudSun, tone: 'violet' },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings, tone: 'amber' },
  ],
}
