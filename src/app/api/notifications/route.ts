import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/notifications - Get notifications for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

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

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type: type || 'info',
        actionUrl: actionUrl || null,
        isRead: false
      }
    })

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

    if (markAllAsRead) {
      // Mark all notifications as read for this user
      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false
        },
        data: {
          isRead: true
        }
      })

      return NextResponse.json({ success: true, message: 'All notifications marked as read' })
    } else if (notificationId) {
      // Mark specific notification as read - use updateMany to allow composite where clause
      const result = await prisma.notification.updateMany({
        where: {
          id: notificationId,
          userId // Ensure user can only update their own notifications
        },
        data: {
          isRead: isRead !== undefined ? isRead : true
        }
      })

      if (result.count === 0) {
        return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 })
      }

      return NextResponse.json({ success: true, message: 'Notification updated' })
    }

    return NextResponse.json({ error: 'Either notificationId or markAllAsRead must be provided' }, { status: 400 })
  } catch (error) {
    console.error('Notification update error:', error)
    return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 })
  }
}

// DELETE /api/notifications - Delete a notification
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, notificationId } = body

    if (!userId || !notificationId) {
      return NextResponse.json({ error: 'User ID and Notification ID are required' }, { status: 400 })
    }

    // Delete the notification, ensuring user can only delete their own - use deleteMany for composite where
    const result = await prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId
      }
    })

    if (result.count === 0) {
      return NextResponse.json({ error: 'Notification not found or unauthorized' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Notification deleted' })
  } catch (error) {
    console.error('Notification deletion error:', error)
    return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 })
  }
}