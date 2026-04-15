import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireUser, serverError, withLogging } from '@/lib/api'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export const GET = withLogging(async (request: NextRequest, { requestId }) => {
  const limited = await enforceRateLimit(request, {
    bucket: 'user-export',
    limit: 3,
    windowSeconds: 3600,
    requestId,
  })
  if (limited) return limited

  const auth = await requireUser(request, { requestId })
  if (!auth.ok) return auth.response
  const userId = auth.user.id

  try {
    const [
      profile,
      farmerProfile,
      crops,
      cropListings,
      products,
      equipment,
      customerOrders,
      sellerOrders,
      reviews,
      cartItems,
      notifications,
      newsletterSub,
    ] = await Promise.all([
      prisma.profile.findUnique({ where: { id: userId } }),
      prisma.farmerProfile.findUnique({ where: { id: userId } }).catch(() => null),
      prisma.crop.findMany({ where: { farmerId: userId } }).catch(() => []),
      prisma.cropListing.findMany({ where: { farmerId: userId } }).catch(() => []),
      prisma.product.findMany({ where: { supplierId: userId } }).catch(() => []),
      prisma.equipment.findMany({ where: { ownerId: userId } }).catch(() => []),
      prisma.order
        .findMany({ where: { customerId: userId }, include: { items: true } })
        .catch(() => []),
      prisma.order
        .findMany({ where: { sellerId: userId }, include: { items: true } })
        .catch(() => []),
      prisma.review.findMany({ where: { reviewerId: userId } }).catch(() => []),
      prisma.cartItem.findMany({ where: { userId } }).catch(() => []),
      prisma.notification.findMany({ where: { userId } }).catch(() => []),
      profile?.email
        ? prisma.newsletterSubscription
            .findUnique({ where: { email: auth.user.email || '' } })
            .catch(() => null)
        : null,
    ])

    const exportedAt = new Date().toISOString()
    const payload = {
      exportedAt,
      userId,
      schemaVersion: 1,
      data: {
        profile,
        farmerProfile,
        crops,
        cropListings,
        products,
        equipment,
        orders: {
          asCustomer: customerOrders,
          asSeller: sellerOrders,
        },
        reviews,
        cartItems,
        notifications,
        newsletterSubscription: newsletterSub,
      },
    }

    logger.info('gdpr.export', { userId, requestId })

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="farmcon-data-${userId.slice(0, 8)}-${exportedAt.split('T')[0]}.json"`,
        'Cache-Control': 'no-store',
        'x-request-id': requestId,
      },
    })
  } catch (error) {
    logger.error('gdpr.export.failed', {
      userId,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return serverError(
      'Failed to export data',
      error instanceof Error ? error.message : undefined,
      requestId,
    )
  }
})
