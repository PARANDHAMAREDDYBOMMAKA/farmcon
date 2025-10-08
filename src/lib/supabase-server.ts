import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'

// Server-side Supabase client for API routes with user authentication
export function createSupabaseServerClient(request?: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (request) {
    // For API routes - extract auth from request headers
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          const cookieValue = request.cookies.get(name)?.value
          return cookieValue
        },
        set() {
          // Not needed for API routes
        },
        remove() {
          // Not needed for API routes
        },
      },
    })
  } else {
    // For server components - use Next.js cookies
    const cookieStore = cookies()
    return createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    })
  }
}

// Alternative approach: Create authenticated client from user session
export async function getAuthenticatedSupabaseClient(request: NextRequest) {
  const supabase = createSupabaseServerClient(request)

  // Get the current user session
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase: null, user: null, error: error || new Error('No authenticated user') }
  }

  return { supabase, user, error: null }
}

// Admin client with service role key - bypasses RLS policies
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
      persistSession: false
    }
  })
}