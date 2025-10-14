import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const email = 'sunnyreddy2005sun@gmail.com'

    const result = await prisma.profile.deleteMany({
      where: { email }
    })
    
    return NextResponse.json({ 
      message: `Deleted ${result.count} profiles with email ${email}` 
    })
  } catch (error) {
    console.error('Cleanup profiles error:', error)
    return NextResponse.json({ error: 'Failed to cleanup profiles' }, { status: 500 })
  }
}