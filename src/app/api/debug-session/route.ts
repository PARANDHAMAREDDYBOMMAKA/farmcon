import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createServerComponentClient({ cookies })
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 })
    }
    
    return NextResponse.json({
      userId: session.user.id,
      email: session.user.email,
      userMetadata: session.user.user_metadata,
      appMetadata: session.user.app_metadata
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}