import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

export function createSupabaseServerClient(request?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (request) {
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll().map(({ name, value }) => ({ name, value }))
        },
        setAll() {},
      },
    })
  }

  const cookieStore = cookies() as any
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        const store = typeof cookieStore?.then === 'function' ? undefined : cookieStore
        if (!store) return []
        return store.getAll().map(({ name, value }: { name: string; value: string }) => ({
          name,
          value,
        }))
      },
      setAll(cookiesToSet) {
        try {
          const store = typeof cookieStore?.then === 'function' ? undefined : cookieStore
          if (!store) return
          cookiesToSet.forEach(({ name, value, options }) =>
            store.set({ name, value, ...options }),
          )
        } catch {}
      },
    },
  })
}

export async function getAuthenticatedSupabaseClient(request: NextRequest) {
  const supabase = createSupabaseServerClient(request)

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase: null, user: null, error: error || new Error('No authenticated user') }
  }

  return { supabase, user, error: null }
}

export function createSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseServiceRoleKey) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not found, using anon key')
    return createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
