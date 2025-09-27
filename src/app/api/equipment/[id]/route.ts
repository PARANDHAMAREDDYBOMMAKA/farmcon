import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Not needed for server-side read operations
          },
          remove(name: string, options: any) {
            // Not needed for server-side read operations
          }
        }
      }
    )
    
    const equipmentId = params.id

    if (!equipmentId) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }

    const { data: equipment, error } = await supabase
      .from('equipment')
      .select(`
        *,
        owner:profiles!equipment_owner_id_fkey (
          full_name,
          city,
          state,
          phone,
          email
        )
      `)
      .eq('id', equipmentId)
      .single()

    if (error) {
      console.error('Error fetching equipment:', error)
      return NextResponse.json({ error: 'Failed to fetch equipment' }, { status: 500 })
    }

    if (!equipment) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 })
    }

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error('Error in equipment API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Not needed for server-side read operations
          },
          remove(name: string, options: any) {
            // Not needed for server-side read operations
          }
        }
      }
    )
    
    const equipmentId = params.id
    const body = await request.json()

    if (!equipmentId) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }

    const { data: equipment, error } = await supabase
      .from('equipment')
      .update({
        name: body.name,
        category: body.category,
        brand: body.brand,
        model: body.model,
        year_manufactured: body.year_manufactured,
        description: body.description,
        images: body.images,
        hourly_rate: body.hourly_rate,
        daily_rate: body.daily_rate,
        status: body.status,
        location: body.location,
        specifications: body.specifications,
        updated_at: new Date().toISOString()
      })
      .eq('id', equipmentId)
      .select(`
        *,
        owner:profiles!equipment_owner_id_fkey (
          full_name,
          city,
          state,
          phone,
          email
        )
      `)
      .single()

    if (error) {
      console.error('Error updating equipment:', error)
      return NextResponse.json({ error: 'Failed to update equipment' }, { status: 500 })
    }

    return NextResponse.json({ equipment })
  } catch (error) {
    console.error('Error in equipment update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            // Not needed for server-side read operations
          },
          remove(name: string, options: any) {
            // Not needed for server-side read operations
          }
        }
      }
    )
    
    const equipmentId = params.id

    if (!equipmentId) {
      return NextResponse.json({ error: 'Equipment ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('equipment')
      .delete()
      .eq('id', equipmentId)

    if (error) {
      console.error('Error deleting equipment:', error)
      return NextResponse.json({ error: 'Failed to delete equipment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in equipment delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}