import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    console.log('=== Database Debug ===')

    const hasDbUrl = !!process.env.DATABASE_URL
    console.log('DATABASE_URL present:', hasDbUrl)
    console.log('DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...')

    console.log('Testing database connection...')
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Database connection successful')

    console.log('Checking if profiles table exists...')
    const tableCheck = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = 'profiles'
    `
    console.log('Profiles table check result:', tableCheck)

    console.log('Counting profiles...')
    const profileCount = await prisma.profile.count()
    console.log('Profile count:', profileCount)

    console.log('Listing first 3 profiles...')
    const profiles = await prisma.profile.findMany({
      take: 3,
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true
      }
    })
    console.log('Sample profiles:', profiles)

    return NextResponse.json({
      success: true,
      database: {
        connected: true,
        hasDbUrl,
        profileCount,
        sampleProfiles: profiles.map(p => ({
          id: p.id,
          email: p.email.substring(0, 3) + '***', 
          role: p.role,
          hasName: !!p.fullName
        }))
      }
    })

  } catch (error: any) {
    console.error('Database debug error:', error)

    return NextResponse.json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        name: error.name
      },
      database: {
        connected: false,
        hasDbUrl: !!process.env.DATABASE_URL
      }
    }, { status: 500 })
  }
}