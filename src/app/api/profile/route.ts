import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { dbOperations } from '@/lib/prisma'

// GET /api/profile - Get user profile
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    console.log('[Profile API] Fetching profile for userId:', userId)
    const profile = await dbOperations.profile.findById(userId)

    if (!profile) {
      console.log('[Profile API] Profile not found for userId:', userId)
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('[Profile API] Profile found successfully')
    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('[Profile API] Profile fetch error:', error)
    console.error('[Profile API] Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      { error: 'Failed to fetch profile', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/profile - Create or update profile
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      id,
      email,
      fullName,
      phone,
      role,
      city,
      state,
      address,
      pincode,
      businessName,
      gstNumber
    } = body

    if (!id || !email) {
      return NextResponse.json(
        { error: 'User ID and email are required' },
        { status: 400 }
      )
    }

    const profile = await dbOperations.profile.upsert({
      id,
      email,
      fullName,
      phone,
      role,
      city,
      state,
      address,
      pincode,
      businessName,
      gstNumber
    })
    return NextResponse.json({ profile })
  } catch (error: any) {
    console.error('Profile upsert error:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      { error: 'Failed to save profile', details: error.message },
      { status: 500 }
    )
  }
}

// PUT /api/profile - Update profile
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, ...updates } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const profile = await dbOperations.profile.update(userId, updates)
    
    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}