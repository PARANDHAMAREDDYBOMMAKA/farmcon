'use client'

import { useEffect, useState, forwardRef, useImperativeHandle } from 'react'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
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

export interface NotificationBellRef {
  closeDropdown: () => void
}

const NotificationBell = forwardRef<NotificationBellRef>((_props, ref) => {
  const { user } = useAuth()
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [showDropdown, setShowDropdown] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadNotifications()

      const subscription = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`
          },
          (payload) => {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
            setUnreadCount(prev => prev + 1)
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [user?.id])

  // Close dropdown when navigating to a different page
  useEffect(() => {
    setShowDropdown(false)
  }, [pathname])

  // Expose closeDropdown function to parent component via ref
  useImperativeHandle(ref, () => ({
    closeDropdown: () => setShowDropdown(false)
  }))

  const loadNotifications = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const response = await fetch(`/api/notifications?userId=${user.id}`)
      if (response.ok) {
        const { notifications } = await response.json()
        setNotifications(notifications || [])
        setUnreadCount(notifications?.filter((n: Notification) => !n.is_read).length || 0)
      } else {
        console.warn('Failed to load notifications')
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setNotifications([])
      setUnreadCount(0)
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
        setUnreadCount(prev => Math.max(0, prev - 1))
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
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id)
    }

    if (notification.action_url) {
      window.location.href = notification.action_url
    }

    setShowDropdown(false)
  }

  const getNotificationIcon = (type: string) => {
    const iconProps = { className: "w-5 h-5" }
    switch (type) {
      case 'order':
        return <Package {...iconProps} className="w-5 h-5 text-blue-600" />
      case 'payment':
        return <CreditCard {...iconProps} className="w-5 h-5 text-green-600" />
      case 'delivery':
        return <Truck {...iconProps} className="w-5 h-5 text-orange-600" />
      case 'review':
        return <Star {...iconProps} className="w-5 h-5 text-yellow-600" />
      default:
        return <Bell {...iconProps} className="w-5 h-5 text-gray-900" />
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

  return (
    <div className="relative">
      {}
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-900 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 rounded-xl transition-all duration-200"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse shadow-lg">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {}
      {showDropdown && (
        <div className="fixed sm:absolute right-4 sm:right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-5 z-50 border border-gray-100">
          <div className="p-4 sm:p-5 border-b border-gray-100 bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-green-600" />
                <h3 className="text-base sm:text-lg font-bold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-sm text-gray-900">Loading...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-8 h-8 text-gray-900" />
                </div>
                <p className="text-sm font-medium text-gray-900">No notifications yet</p>
                <p className="mt-1 text-xs text-gray-900">We'll notify you when something arrives</p>
              </div>
            ) : (
              <>
                {}
                {notifications.filter(n => !n.is_read).length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                      <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                        Unread ({notifications.filter(n => !n.is_read).length})
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {notifications.filter(n => !n.is_read).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className="p-3 sm:p-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer transition-all duration-200 bg-blue-50/50 border-l-2 border-blue-500"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-white shadow-sm">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs sm:text-sm font-semibold text-gray-900">
                                  {notification.title}
                                </p>
                                <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-900 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-900 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {}
                {notifications.filter(n => n.is_read).length > 0 && (
                  <div>
                    <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
                      <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Earlier ({notifications.filter(n => n.is_read).length})
                      </h4>
                    </div>
                    <div className="divide-y divide-gray-50">
                      {notifications.filter(n => n.is_read).map((notification) => (
                        <div
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification)}
                          className="p-3 sm:p-4 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 cursor-pointer transition-all duration-200"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-gray-100">
                              {getNotificationIcon(notification.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-semibold text-gray-700">
                                {notification.title}
                              </p>
                              <p className="text-xs sm:text-sm text-gray-900 mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-900 mt-2 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(notification.created_at)}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 sm:p-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => {
                  window.location.href = '/dashboard/notifications'
                  setShowDropdown(false)
                }}
                className="w-full text-center text-xs sm:text-sm font-semibold text-green-600 hover:text-green-700 py-2 rounded-lg hover:bg-white transition-all duration-200"
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}

      {}
      {showDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  )
})

NotificationBell.displayName = 'NotificationBell'

export default NotificationBell