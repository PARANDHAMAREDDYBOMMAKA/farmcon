import { supabase } from './supabase'

export async function authedFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const headers = new Headers(init.headers || {})
  if (session?.access_token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${session.access_token}`)
  }

  return fetch(input, {
    ...init,
    credentials: init.credentials ?? 'include',
    headers,
  })
}
