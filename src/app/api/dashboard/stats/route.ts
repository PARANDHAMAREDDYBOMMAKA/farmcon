import { NextRequest, NextResponse } from 'next/server'
import { dbOperations, prisma } from '@/lib/prisma'
import { cache, CacheKeys } from '@/lib/redis'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const role = searchParams.get('role')

    if (!userId || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 })
    }

    const cacheKey = CacheKeys.dashboardStats(userId, role)
    const cached = await cache.get(cacheKey)

    if (cached) {
      return NextResponse.json({ stats: cached, source: 'cache' })
    }

    let stats = {}

    switch (role) {
      case 'farmer':
        stats = await loadFarmerStats(userId)
        break
      case 'consumer':
        stats = await loadConsumerStats(userId)
        break
      case 'supplier':
        stats = await loadSupplierStats(userId)
        break
      case 'admin':
        stats = await loadAdminStats()
        break
      default:
        stats = {}
    }

    await cache.set(cacheKey, stats, 300)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Dashboard stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch dashboard stats' },
      { status: 500 }
    )
  }
}

async function loadFarmerStats(farmerId: string) {
  try {
    const [crops, orders, soldCrops] = await Promise.all([
      prisma.crop.findMany({
        where: { farmerId },
        select: { id: true, status: true }
      }),
      prisma.order.findMany({
        where: { 
          sellerId: farmerId,
          paymentStatus: 'paid'  
        },
        select: { totalAmount: true, status: true, createdAt: true }
      }),
      prisma.crop.findMany({
        where: { 
          farmerId,
          status: 'sold'
        },
        select: { id: true }
      })
    ])

    const activeCrops = crops.filter(crop => 
      ['planted', 'growing', 'ready_to_harvest'].includes(crop.status)
    ).length

    const totalRevenue = orders.reduce((sum, order) => 
      sum + Number(order.totalAmount), 0
    )

    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return orderDate >= thirtyDaysAgo
    })

    const monthlyRevenue = monthlyOrders.reduce((sum, order) => 
      sum + Number(order.totalAmount), 0
    )

    const pendingOrders = orders.filter(order => 
      order.status === 'pending'
    ).length

    return {
      activeCrops,
      totalRevenue,
      monthlyRevenue,
      pendingOrders,
      totalCrops: crops.length,
      soldCrops: soldCrops.length
    }
  } catch (error) {
    console.error('Error loading farmer stats:', error)
    return {
      activeCrops: 0,
      totalRevenue: 0,
      monthlyRevenue: 0,
      pendingOrders: 0,
      totalCrops: 0,
      soldCrops: 0
    }
  }
}

async function loadConsumerStats(consumerId: string) {
  try {
    const [orders, cartItems] = await Promise.all([
      prisma.order.findMany({
        where: { 
          customerId: consumerId,
          paymentStatus: 'paid'  
        },
        select: { totalAmount: true, status: true, createdAt: true }
      }),
      prisma.cartItem.findMany({
        where: { userId: consumerId },
        select: { id: true }
      })
    ])

    const totalSpent = orders.reduce((sum, order) => 
      sum + Number(order.totalAmount), 0
    )

    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return orderDate >= thirtyDaysAgo
    })

    const monthlySpent = monthlyOrders.reduce((sum, order) => 
      sum + Number(order.totalAmount), 0
    )

    const pendingOrders = orders.filter(order => 
      order.status === 'pending'
    ).length

    return {
      totalOrders: orders.length,
      pendingOrders,
      cartItems: cartItems.length,
      totalSpent,
      monthlySpent
    }
  } catch (error) {
    console.error('Error loading consumer stats:', error)
    return {
      totalOrders: 0,
      pendingOrders: 0,
      cartItems: 0,
      totalSpent: 0,
      monthlySpent: 0
    }
  }
}

async function loadSupplierStats(supplierId: string) {
  try {
    
    const [products, orders, productStock] = await Promise.all([
      prisma.product.findMany({
        where: { supplierId },
        select: {
          id: true,
          isActive: true,
          stockQuantity: true
        }
      }),
      
      prisma.order.findMany({
        where: {
          items: {
            some: {
              product: {
                supplierId: supplierId
              }
            }
          }
        },
        include: {
          items: {
            where: {
              product: {
                supplierId: supplierId
              }
            },
            include: {
              product: true
            }
          }
        }
      }),
      
      prisma.product.aggregate({
        where: { supplierId },
        _sum: {
          stockQuantity: true
        }
      })
    ])

    const activeProducts = products.filter(product => product.isActive).length
    const lowStockProducts = products.filter(product => product.stockQuantity < 10).length
    const outOfStockProducts = products.filter(product => product.stockQuantity === 0).length

    const monthlyOrders = orders.filter(order => {
      const orderDate = new Date(order.createdAt)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      return orderDate >= thirtyDaysAgo
    })

    const monthlyRevenue = monthlyOrders.reduce((sum, order) => {
      const supplierItemsValue = order.items.reduce((itemSum, item) => {
        const itemPrice = item.product?.price ? Number(item.product.price) : 0
        return itemSum + (itemPrice * item.quantity)
      }, 0)
      return sum + supplierItemsValue
    }, 0)

    const pendingOrders = orders.filter(order =>
      order.status === 'PENDING'
    ).length

    const totalRevenue = orders.reduce((sum, order) => {
      const supplierItemsValue = order.items.reduce((itemSum, item) => {
        const itemPrice = item.product?.price ? Number(item.product.price) : 0
        return itemSum + (itemPrice * item.quantity)
      }, 0)
      return sum + supplierItemsValue
    }, 0)

    return {
      totalProducts: products.length,
      activeProducts,
      inactiveProducts: products.length - activeProducts,
      lowStockItems: lowStockProducts,
      outOfStockItems: outOfStockProducts,
      totalStock: productStock._sum.stockQuantity || 0,
      monthlyRevenue,
      totalRevenue,
      pendingOrders,
      totalOrders: orders.length
    }
  } catch (error) {
    console.error('Error loading supplier stats:', error)
    return {
      totalProducts: 0,
      activeProducts: 0,
      inactiveProducts: 0,
      lowStockItems: 0,
      outOfStockItems: 0,
      totalStock: 0,
      monthlyRevenue: 0,
      totalRevenue: 0,
      pendingOrders: 0,
      totalOrders: 0
    }
  }
}

async function loadAdminStats() {
  try {
    const [users, products, orders] = await Promise.all([
      prisma.profile.findMany({
        select: { id: true, role: true }
      }),
      prisma.product.findMany({
        select: { id: true }
      }),
      prisma.order.findMany({
        select: { id: true }
      })
    ])

    const farmers = users.filter(user => user.role === 'farmer').length

    return {
      totalUsers: users.length,
      totalProducts: products.length,
      totalOrders: orders.length,
      farmers
    }
  } catch (error) {
    console.error('Error loading admin stats:', error)
    return {
      totalUsers: 0,
      totalProducts: 0,
      totalOrders: 0,
      farmers: 0
    }
  }
}