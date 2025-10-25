'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { profileAPI } from '@/lib/api-client'
import type { User } from '@/types'

export default function MarketPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/signin')
        return
      }

      const profile = await profileAPI.getProfile(session.user.id)
      setUser(profile)
    } catch (error) {
      console.error('Error loading data:', error)
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading market data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Market Prices</h1>
          <p className="text-gray-900">View current market prices for agricultural products</p>
        </div>

        <div className="text-center py-12">
          <span className="text-6xl">📊</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Market Data Coming Soon</h3>
          <p className="mt-2 text-gray-900">
            We're working on bringing you real-time market prices and trends.
          </p>
        </div>
      </div>
    </div>
  )
}