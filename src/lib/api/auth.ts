import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UserRole } from '@/types'
import { getAuthenticatedSupabaseClient } from '@/lib/supabase-server'
import { forbidden, unauthorized } from './response'

export type AuthedUser = {
  id: string
  email: string | null
  role: UserRole | null
  fullName: string | null
  city: string | null
  state: string | null
}

export type AuthContext =
  | { ok: true; user: AuthedUser }
  | { ok: false; response: Response }

async function verifyBearer(token: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !anon) return null
  try {
    const client = createClient(url, anon, {
      auth: { autoRefreshToken: false, persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data, error } = await client.auth.getUser(token)
    if (error || !data?.user) return null
    return data.user
  } catch {
    return null
  }
}

async function getSession(request: NextRequest) {
  const path = new URL(request.url).pathname

  try {
    const { user } = await getAuthenticatedSupabaseClient(request)
    if (user) return { session: user, error: null }
  } catch (err) {
    console.warn('[auth] cookie-based auth threw', { path, err })
  }

  const authHeader = request.headers.get('authorization')
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    const token = authHeader.slice(7).trim()
    const user = await verifyBearer(token)
    if (user) return { session: user, error: null }
  }

  const cookieNames = request.cookies.getAll().map((c) => c.name)
  console.warn('[auth] No session', {
    path,
    cookieNames,
    hasAuthHeader: !!authHeader,
  })
  return { session: null, error: 'No session' as const }
}

export async function requireUser(
  request: NextRequest,
  opts?: { roles?: UserRole[]; requestId?: string },
): Promise<AuthContext> {
  const { session } = await getSession(request)
  if (!session) {
    return { ok: false, response: unauthorized(undefined, opts?.requestId) }
  }

  const meta = (session.user_metadata || {}) as Record<string, any>
  const role = (meta.role || null) as UserRole | null
  const email = session.email || null

  const user: AuthedUser = {
    id: session.id,
    email,
    role,
    fullName: meta.full_name || null,
    city: meta.city || null,
    state: meta.state || null,
  }

  if (opts?.roles && opts.roles.length > 0) {
    if (!role || !opts.roles.includes(role)) {
      return {
        ok: false,
        response: forbidden(
          `Requires role: ${opts.roles.join(' or ')}`,
          opts?.requestId,
        ),
      }
    }
  }

  return { ok: true, user }
}

export async function optionalUser(request: NextRequest): Promise<AuthedUser | null> {
  const { session } = await getSession(request)
  if (!session) return null
  const meta = (session.user_metadata || {}) as Record<string, any>
  return {
    id: session.id,
    email: session.email || null,
    role: (meta.role || null) as UserRole | null,
    fullName: meta.full_name || null,
    city: meta.city || null,
    state: meta.state || null,
  }
}
