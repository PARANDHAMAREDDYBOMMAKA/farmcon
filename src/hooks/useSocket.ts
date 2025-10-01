'use client'

import { useEffect, useState } from 'react'
import { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket } from '@/lib/socket'

export function useSocket(userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = connectSocket(userId)
    setSocket(socketInstance)

    const onConnect = () => setIsConnected(true)
    const onDisconnect = () => setIsConnected(false)

    socketInstance.on('connect', onConnect)
    socketInstance.on('disconnect', onDisconnect)

    return () => {
      socketInstance.off('connect', onConnect)
      socketInstance.off('disconnect', onDisconnect)
      disconnectSocket()
    }
  }, [userId])

  return { socket, isConnected }
}

// Hook for order updates
export function useOrderUpdates(userId: string, onUpdate: (data: any) => void) {
  const { socket } = useSocket(userId)

  useEffect(() => {
    if (!socket) return

    socket.on('order:updated', onUpdate)

    return () => {
      socket.off('order:updated', onUpdate)
    }
  }, [socket, onUpdate])
}

// Hook for cart updates
export function useCartUpdates(userId: string, onUpdate: (data: any) => void) {
  const { socket } = useSocket(userId)

  useEffect(() => {
    if (!socket) return

    socket.on('cart:updated', onUpdate)

    return () => {
      socket.off('cart:updated', onUpdate)
    }
  }, [socket, onUpdate])
}

// Hook for notifications
export function useNotifications(userId: string, onNotification: (data: any) => void) {
  const { socket } = useSocket(userId)

  useEffect(() => {
    if (!socket) return

    socket.on('notification:new', onNotification)

    return () => {
      socket.off('notification:new', onNotification)
    }
  }, [socket, onNotification])
}

// Hook for price updates
export function usePriceUpdates(onUpdate: (data: any) => void) {
  const { socket } = useSocket()

  useEffect(() => {
    if (!socket) return

    socket.on('price:updated', onUpdate)

    return () => {
      socket.off('price:updated', onUpdate)
    }
  }, [socket, onUpdate])
}
