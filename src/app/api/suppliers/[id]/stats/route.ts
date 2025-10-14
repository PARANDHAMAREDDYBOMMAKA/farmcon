import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplierId = params.id

    const productStats = await prisma.product.aggregate({
      where: { supplierId },
      _count: {
        id: true
      },
      _sum: {
        stockQuantity: true
      },
      _avg: {
        price: true
      }
    })

    const activeProductsCount = await prisma.product.count({
      where: {
        supplierId,
        isActive: true
      }
    })

    const lowStockProducts = await prisma.product.count({
      where: {
        supplierId,
        stockQuantity: {
          lt: 10
        }
      }
    })

    const outOfStockProducts = await prisma.product.count({
      where: {
        supplierId,
        stockQuantity: 0
      }
    })

    const orderStats = await prisma.order.aggregate({
      where: {
        items: {
          some: {
            product: {
              supplierId
            }
          }
        }
      },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    })

    const pendingOrders = await prisma.order.count({
      where: {
        items: {
          some: {
            product: {
              supplierId
            }
          }
        },
        status: 'PENDING'
      }
    })

    const completedOrders = await prisma.order.count({
      where: {
        items: {
          some: {
            product: {
              supplierId
            }
          }
        },
        status: 'DELIVERED'
      }
    })

    const reviewStats = await prisma.review.aggregate({
      where: {
        product: {
          supplierId
        }
      },
      _count: {
        id: true
      },
      _avg: {
        rating: true
      }
    })

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const recentOrderStats = await prisma.order.aggregate({
      where: {
        items: {
          some: {
            product: {
              supplierId
            }
          }
        },
        createdAt: {
          gte: thirtyDaysAgo
        }
      },
      _count: {
        id: true
      },
      _sum: {
        totalAmount: true
      }
    })

    const categoryStats = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { supplierId },
      _count: {
        id: true
      },
      _sum: {
        stockQuantity: true
      }
    })

    const categories = await prisma.category.findMany({
      where: {
        id: {
          in: categoryStats.map(stat => stat.categoryId)
        }
      }
    })

    const categoryBreakdown = categoryStats.map(stat => {
      const category = categories.find(c => c.id === stat.categoryId)
      return {
        categoryId: stat.categoryId,
        categoryName: category?.name || 'Unknown',
        productCount: stat._count.id,
        totalStock: stat._sum.stockQuantity || 0
      }
    })

    const stats = {
      products: {
        total: productStats._count.id,
        active: activeProductsCount,
        inactive: productStats._count.id - activeProductsCount,
        lowStock: lowStockProducts,
        outOfStock: outOfStockProducts,
        totalStock: productStats._sum.stockQuantity || 0,
        averagePrice: productStats._avg.price || 0
      },
      orders: {
        total: orderStats._count.id,
        pending: pendingOrders,
        completed: completedOrders,
        totalRevenue: orderStats._sum.totalAmount || 0,
        recentOrders: recentOrderStats._count.id,
        recentRevenue: recentOrderStats._sum.totalAmount || 0
      },
      reviews: {
        total: reviewStats._count.id,
        averageRating: reviewStats._avg.rating || 0
      },
      categories: categoryBreakdown
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Supplier stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier statistics' },
      { status: 500 }
    )
  }
}