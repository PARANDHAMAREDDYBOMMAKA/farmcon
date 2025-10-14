import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    
    await prisma.$queryRaw`SELECT 1`

    const profileCount = await prisma.profile.count()

    const profiles = await prisma.profile.findMany({
      take: 10,
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        createdAt: true
      }
    })
    
    return NextResponse.json({
      status: 'Database connected',
      profileCount,
      profiles
    })
  } catch (error: any) {
    console.error('Database test error:', error)
    return NextResponse.json(
      { 
        error: 'Database connection failed', 
        details: error.message,
        code: error.code 
      },
      { status: 500 }
    )
  }
}