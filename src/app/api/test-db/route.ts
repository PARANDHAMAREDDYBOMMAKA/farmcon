import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$queryRaw`SELECT 1`
    
    // Count profiles
    const profileCount = await prisma.profile.count()
    
    // Get all profiles (limit 10 for safety)
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