import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const getSocket = (): Socket => {
  if (!socket) {
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'

    socket = io(socketUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    })

    socket.on('connect', () => {
      console.log('✅ Socket.IO connected')
    })

    socket.on('disconnect', () => {
      console.log('❌ Socket.IO disconnected')
    })

    socket.on('error', (error) => {
      console.error('Socket.IO error:', error)
    })
  }

  return socket
}

export const connectSocket = (userId?: string) => {
  const socket = getSocket()

  if (!socket.connected) {
    socket.connect()

    if (userId) {
      socket.emit('join', { userId })
    }
  }

  return socket
}

export const disconnectSocket = () => {
  if (socket && socket.connected) {
    socket.disconnect()
  }
}

export default getSocket
