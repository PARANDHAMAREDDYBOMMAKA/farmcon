'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sprout } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Navbar } from '@/components/landing/Navbar'
import { Hero } from '@/components/landing/Hero'
import { Stats } from '@/components/landing/Stats'
import { Features } from '@/components/landing/Features'
import { Personas } from '@/components/landing/Personas'
import { Newsletter } from '@/components/landing/Newsletter'
import { Footer } from '@/components/landing/Footer'
import { StructuredData } from '@/components/landing/StructuredData'

export default function Home() {
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

  useEffect(() => {
    let active = true
    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (active && session) {
          router.push('/dashboard')
          return
        }
      } catch (error) {
        console.error('Auth check failed:', error)
      } finally {
        if (active) setCheckingAuth(false)
      }
    }
    run()
    return () => {
      active = false
    }
  }, [router])

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200" />
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <Sprout className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
          </div>
          <p className="mt-4 text-sm font-semibold text-emerald-700">Loading FarmCon…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <StructuredData />
      <Navbar />
      <main>
        <Hero />
        <Stats />
        <Features />
        <Personas />
        <Newsletter />
      </main>
      <Footer />
    </div>
  )
}
