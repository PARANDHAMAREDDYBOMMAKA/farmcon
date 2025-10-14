import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    const profiles = await prisma.profile.findMany({
      where: email ? { email } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    let supabaseUser = null
    if (email) {
      try {
        const { data } = await supabase.auth.admin.listUsers()
        supabaseUser = data.users.filter(u => u.email === email)
      } catch (e) {
        console.log('Could not fetch Supabase users:', e)
      }
    }
    
    return NextResponse.json({ profiles, supabaseUsers: supabaseUser })
  } catch (error) {
    console.error('Debug profiles error:', error)
    return NextResponse.json({ error: 'Failed to fetch profiles' }, { status: 500 })
  }
}