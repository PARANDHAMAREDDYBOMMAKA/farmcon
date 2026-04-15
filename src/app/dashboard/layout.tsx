'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Sprout } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { profileAPI } from '@/lib/api-client'
import type { User } from '@/types'
import NotificationBell, { NotificationBellRef } from '@/components/notifications/NotificationBell'
import ToastProvider from '@/components/providers/ToastProvider'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Sidebar } from '@/components/dashboard/Sidebar'

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-200" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
          <Sprout className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
        </div>
        <p className="mt-4 text-sm font-semibold text-emerald-700">Loading your workspace…</p>
      </div>
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
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
      if (event === 'SIGNED_OUT') router.push('/')
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) return <LoadingScreen />
  if (!user) return null

  const firstName = user.fullName?.split(' ')[0] || 'there'

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50/60 via-white to-teal-50/40">
      <Sidebar
        user={user}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onSignOut={handleSignOut}
      />

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-40 h-16 bg-white/85 backdrop-blur-xl border-b border-emerald-100">
          <div className="h-full px-4 sm:px-6 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="hidden sm:flex items-center gap-2 min-w-0">
                <span className="text-sm font-semibold text-emerald-700">Welcome back,</span>
                <span className="text-sm font-extrabold text-emerald-950 truncate">{firstName}</span>
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
            <ErrorBoundary>{children}</ErrorBoundary>
          </div>
        </main>
      </div>

      <ToastProvider />
    </div>
  )
}
