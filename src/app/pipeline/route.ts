import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    return NextResponse.json({ 
      status: 'success',
      message: 'Pipeline operation completed',
      data: body 
    })
  } catch (error: any) {
    console.error('Pipeline error:', error)
    return NextResponse.json(
      { error: 'Pipeline operation failed', details: error.message },
      { status: 500 }
    )
  }
}