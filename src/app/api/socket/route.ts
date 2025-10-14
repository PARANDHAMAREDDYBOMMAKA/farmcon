import { NextRequest } from 'next/server'
import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'

let io: SocketIOServer | null = null

export async function GET(req: NextRequest) {
  if (!io) {
    
    const httpServer: HTTPServer = (req as any).socket.server

    io = new SocketIOServer(httpServer, {
      path: '/api/socket',
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
      },
    })

    io.on('connection', (socket) => {
      console.log('✅ New socket connection:', socket.id)

      socket.on('join', ({ userId }) => {
        socket.join(`user:${userId}`)
        console.log(`User ${userId} joined their room`)
      })

      socket.on('order:update', (data) => {
        const { orderId, userId, status } = data
        io?.to(`user:${userId}`).emit('order:updated', { orderId, status })
      })

      socket.on('cart:update', (data) => {
        const { userId } = data
        io?.to(`user:${userId}`).emit('cart:updated', data)
      })

      socket.on('notification:send', (data) => {
        const { userId, notification } = data
        io?.to(`user:${userId}`).emit('notification:new', notification)
      })

      socket.on('price:update', (data) => {
        io?.emit('price:updated', data)
      })

      socket.on('disconnect', () => {
        console.log('❌ Socket disconnected:', socket.id)
      })
    })
  }

  return new Response('Socket.IO server initialized', { status: 200 })
}
