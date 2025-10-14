import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const farmerProfile = await dbOperations.farmer.findById(userId)
    
    return NextResponse.json({ farmerProfile })
  } catch (error) {
    console.error('Farmer profile fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch farmer profile' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('Farmer POST request - body:', body)
    
    if (!body.id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    
    const farmerProfile = await dbOperations.farmer.upsert(body)
    
    console.log('Farmer profile upserted successfully:', farmerProfile.id)
    return NextResponse.json({ farmerProfile })
  } catch (error: any) {
    console.error('Farmer profile upsert error:', error)
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      stack: error.stack
    })
    return NextResponse.json(
      { error: 'Failed to save farmer profile', details: error.message },
      { status: 500 }
    )
  }
}