'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Sprout,
  ShoppingCart,
  Tractor,
  Package,
  CloudSun,
  TrendingUp,
  Carrot,
  ClipboardList,
  BarChart3,
  Settings,
  Users,
  X,
  LogOut,
  Wheat,
  Store,
  Shield,
  UserCog,
  Sparkles,
  ChevronRight,
  Gift,
  CreditCard,
  Lock,
} from 'lucide-react'
import type { User } from '@/types'
import { cn } from '@/lib/cn'

type NavItem = {
  name: string
  href: string
  icon: React.ElementType
  badge?: string
}

type NavGroup = {
  label: string
  items: NavItem[]
}

const navigation: Record<string, NavGroup[]> = {
  farmer: [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'My Crops', href: '/dashboard/crops', icon: Sprout },
        { name: 'Orders', href: '/dashboard/orders', icon: Package },
      ],
    },
    {
      label: 'Grow & sell',
      items: [
        { name: 'Buy Supplies', href: '/dashboard/supplies', icon: ShoppingCart },
        { name: 'Equipment', href: '/dashboard/equipment', icon: Tractor },
        { name: 'Weather', href: '/dashboard/weather', icon: CloudSun },
        { name: 'Market Prices', href: '/dashboard/market-prices', icon: TrendingUp },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'Refer & earn', href: '/dashboard/referrals', icon: Gift },
        { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
        { name: 'Privacy & data', href: '/dashboard/privacy', icon: Lock },
      ],
    },
  ],
  consumer: [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Browse', href: '/dashboard/browse', icon: Carrot },
        { name: 'My Orders', href: '/dashboard/orders', icon: Package },
        { name: 'Cart', href: '/dashboard/cart', icon: ShoppingCart },
      ],
    },
    {
      label: 'Insights',
      items: [
        { name: 'Weather', href: '/dashboard/weather', icon: CloudSun },
        { name: 'Market Prices', href: '/dashboard/market-prices', icon: TrendingUp },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'Refer & earn', href: '/dashboard/referrals', icon: Gift },
        { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
        { name: 'Privacy & data', href: '/dashboard/privacy', icon: Lock },
      ],
    },
  ],
  supplier: [
    {
      label: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'My Products', href: '/dashboard/products', icon: Package },
        { name: 'Orders', href: '/dashboard/orders', icon: ClipboardList },
        { name: 'Inventory', href: '/dashboard/inventory', icon: BarChart3 },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { name: 'Weather', href: '/dashboard/weather', icon: CloudSun },
        { name: 'Market Prices', href: '/dashboard/market-prices', icon: TrendingUp },
      ],
    },
    {
      label: 'Account',
      items: [
        { name: 'Refer & earn', href: '/dashboard/referrals', icon: Gift },
        { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
        { name: 'Privacy & data', href: '/dashboard/privacy', icon: Lock },
      ],
    },
  ],
  admin: [
    {
      label: 'Operations',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Users', href: '/dashboard/users', icon: Users },
        { name: 'Products', href: '/dashboard/all-products', icon: Package },
        { name: 'Orders', href: '/dashboard/all-orders', icon: ClipboardList },
      ],
    },
    {
      label: 'Intelligence',
      items: [
        { name: 'Market Prices', href: '/dashboard/market-prices', icon: TrendingUp },
        { name: 'Weather', href: '/dashboard/weather', icon: CloudSun },
      ],
    },
    {
      label: 'System',
      items: [
        { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        { name: 'Privacy & data', href: '/dashboard/privacy', icon: Lock },
      ],
    },
  ],
}

const roleIcons: Record<string, React.ElementType> = {
  farmer: Wheat,
  consumer: ShoppingCart,
  supplier: Store,
  admin: Shield,
}

const roleLabels: Record<string, string> = {
  farmer: 'Farmer workspace',
  consumer: 'Buyer workspace',
  supplier: 'Supplier workspace',
  admin: 'Admin console',
}

export function Sidebar({
  user,
  open,
  onClose,
  onSignOut,
  children,
}: {
  user: User
  open: boolean
  onClose: () => void
  onSignOut: () => void
  children?: React.ReactNode
}) {
  const pathname = usePathname()
  const groups = navigation[user.role] || navigation.consumer
  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const RoleIcon = roleIcons[user.role] || UserCog
  const initial = user.fullName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'

  return (
    <>
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col',
          'bg-gradient-to-b from-emerald-900 via-emerald-950 to-teal-950',
          'shadow-2xl shadow-emerald-900/40',
          'transform transition-transform duration-300 ease-out lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="h-16 px-5 flex items-center justify-between border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/40 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <div className="leading-none">
              <span className="block font-extrabold text-lg text-white tracking-tight">FarmCon</span>
              <div className="flex items-center gap-1 mt-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span className="text-[10px] text-amber-300 font-bold uppercase tracking-wider">
                  Smart Agri OS
                </span>
              </div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden w-9 h-9 rounded-lg hover:bg-white/10 text-white/80 hover:text-white flex items-center justify-center"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-4 py-4">
          <div className="flex items-center gap-3 px-3.5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 ring-1 ring-emerald-400/30 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
              <RoleIcon className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">{roleLabels[user.role] || 'Workspace'}</p>
              <p className="text-xs text-emerald-200">All systems operational</p>
            </div>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400" />
            </span>
          </div>
        </div>

        <nav className="flex-1 px-3 overflow-y-auto scrollbar-hide">
          {groups.map((group) => (
            <div key={group.label} className="mb-5">
              <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-300/70">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const active = isActive(item.href)
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all',
                        active
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/30'
                          : 'text-emerald-100/80 hover:text-white hover:bg-white/10',
                      )}
                    >
                      <Icon
                        className={cn(
                          'w-[18px] h-[18px] transition-colors',
                          active ? 'text-white' : 'text-emerald-300 group-hover:text-emerald-200',
                        )}
                      />
                      <span className="flex-1 truncate">{item.name}</span>
                      {active && <ChevronRight className="w-4 h-4 text-white/80" />}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {children && (
          <div className="px-4 py-4 border-t border-white/10">{children}</div>
        )}

        <div className="p-4 border-t border-white/10 bg-black/20">
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-white/5 transition-all group"
          >
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-lg font-extrabold shadow-lg shadow-emerald-500/30">
                {initial}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-400 rounded-full ring-2 ring-emerald-950" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white truncate group-hover:text-emerald-200 transition-colors">
                {user.fullName || 'User'}
              </p>
              <p className="text-xs text-emerald-300/80 truncate">{user.email}</p>
            </div>
          </Link>

          <button
            onClick={onSignOut}
            className="mt-2.5 w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-rose-200 hover:text-white bg-transparent hover:bg-rose-500/20 ring-1 ring-transparent hover:ring-rose-400/40 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-emerald-950/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
    </>
  )
}
