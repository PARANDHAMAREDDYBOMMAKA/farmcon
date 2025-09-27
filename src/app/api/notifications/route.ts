import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/notifications - Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('Error fetching notifications:', error)
      // Return empty array instead of error to allow UI to function
      return NextResponse.json({ notifications: [] })
    }

    return NextResponse.json({ notifications: notifications || [] })
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ notifications: [] })
  }
}

// POST /api/notifications - Create a new notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, title, message, type, actionUrl } = body

    if (!userId || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, title, message' },
        { status: 400 }
      )
    }

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type: type || 'info',
        action_url: actionUrl || null,
        is_read: false
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating notification:', error)
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
    }

    return NextResponse.json({ notification })
  } catch (error) {
    console.error('Notification creation error:', error)
    return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 })
  }
}

// PUT /api/notifications - Update notifications (mark as read)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, notificationId, isRead, markAllAsRead } = body

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    let query = supabase.from('notifications')

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      const { error } = await query
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all notifications as read:', error)
        return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    } else if (notificationId) {
      // Mark specific notification as read
      const { error } = await query
        .update({ is_read: isRead !== undefined ? isRead : true })
        .eq('id', notificationId)
        .eq('user_id', userId) // Ensure user can only update their own notifications

      if (error) {
        console.error('Error updating notification:', error)
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
      }

      return NextResponse.json({ success: true, message: 'Notification updated' })
    }

    return NextResponse.json({ error: 'Either notificationId or markAllAsRead must be provided' }, { status: 400 })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}