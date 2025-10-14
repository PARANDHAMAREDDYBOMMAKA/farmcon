'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Bell, Package, CreditCard, Truck, Star, Clock } from 'lucide-react'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: string
  is_read: boolean
  action_url?: string
  created_at: string
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all')

  useEffect(() => {
    if (user?.id) {
      loadNotifications()
    }
  }, [user?.id])

  const loadNotifications = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/notifications?userId=${user.id}`)
      if (response.ok) {
        const { notifications } = await response.json()
        setNotifications(notifications || [])
      } else {
        console.warn('Failed to load notifications')
        setNotifications([])
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          notificationId,
          isRead: true
        })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n =>
            n.id === notificationId ? { ...n, is_read: true } : n
          )
        )
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    if (!user?.id) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          markAllAsRead: true
        })
      })

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        )
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          notificationId
        })
      })

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId))
      }
    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    if (notification.action_url) {
      router.push(notification.action_url)
    }
  }

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "w-6 h-6" }
    switch (type) {
      case 'order':
        return <Package {...iconProps} className="w-6 h-6 text-blue-600" />
      case 'payment':
        return <CreditCard {...iconProps} className="w-6 h-6 text-green-600" />
      case 'delivery':
        return <Truck {...iconProps} className="w-6 h-6 text-orange-600" />
      case 'review':
        return <Star {...iconProps} className="w-6 h-6 text-yellow-600" />
      default:
        return <Bell {...iconProps} className="w-6 h-6 text-gray-600" />
    }
  }

  const timeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return 'Just now'
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes}m ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours}h ago`
    } else {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days}d ago`
    }
  }

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.is_read
    if (filter === 'read') return n.is_read
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg p-6 border border-white/40">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-md">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
              <p className="text-sm text-gray-600">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-all duration-300 font-medium shadow-md"
            >
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 overflow-hidden">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              filter === 'all'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            All ({notifications.length})
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              filter === 'unread'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Unread ({unreadCount})
          </button>
          <button
            onClick={() => setFilter('read')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-all duration-200 ${
              filter === 'read'
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Read ({notifications.filter(n => n.is_read).length})
          </button>
        </div>
      </div>

      {}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-white/40 overflow-hidden">
        {filteredNotifications.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No notifications</p>
            <p className="mt-2 text-sm text-gray-500">
              {filter === 'unread' ? "You're all caught up!" : 'No notifications to show'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition-all duration-200 ${
                  !notification.is_read ? 'bg-blue-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                      !notification.is_read ? 'bg-white shadow-md' : 'bg-gray-100'
                    }`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3
                        className={`text-base font-semibold cursor-pointer hover:text-green-600 ${
                          !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                        }`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span className="flex-shrink-0 w-2.5 h-2.5 bg-blue-500 rounded-full mt-1.5"></span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {timeAgo(notification.created_at)}
                      </p>
                      <div className="flex items-center gap-2">
                        {!notification.is_read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-green-600 hover:text-green-700 font-medium hover:underline"
                          >
                            Mark as read
                          </button>
                        )}
                        {notification.action_url && (
                          <button
                            onClick={() => handleNotificationClick(notification)}
                            className="text-xs text-blue-600 hover:text-blue-700 font-medium hover:underline"
                          >
                            View details →
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notification.id)}
                          className="text-xs text-red-600 hover:text-red-700 font-medium hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
