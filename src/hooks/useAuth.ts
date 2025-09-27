import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { profileAPI } from '@/lib/api-client'
import type { User } from '@/types'

export function useAuth(requiredRole?: string) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          router.push('/auth/signin')
          return
        }

        // Get user profile using our API
        const profile = await profileAPI.getProfile(session.user.id)

        if (!profile) {
          router.push('/auth/complete-profile')
          return
        }

        // Check role requirement
        if (requiredRole && profile.role !== requiredRole) {
          router.push('/dashboard')
          return
        }

        setUser(profile)
      } catch (error) {
        console.error('Error loading user:', error)
        router.push('/auth/signin')
      } finally {
        setLoading(false)
      }
    }

    loadUser()
  }, [router, requiredRole])

  return { user, loading }
}