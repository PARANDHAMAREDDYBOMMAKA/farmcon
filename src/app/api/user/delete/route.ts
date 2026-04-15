import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import {
  badRequest,
  ok,
  parseBody,
  requireUser,
  serverError,
  withLogging,
} from '@/lib/api'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  confirm: z.literal('DELETE MY ACCOUNT'),
  reason: z.string().max(500).optional(),
})

export const POST = withLogging(async (request: NextRequest, { requestId }) => {
  const limited = await enforceRateLimit(request, {
    bucket: 'user-delete',
    limit: 2,
    windowSeconds: 3600,
    requestId,
  })
  if (limited) return limited

  const auth = await requireUser(request, { requestId })
  if (!auth.ok) return auth.response
  const userId = auth.user.id

  const parsed = await parseBody(request, bodySchema, requestId)
  if (!parsed.ok) return parsed.response

  try {
    const pending = await prisma.order.count({
      where: {
        OR: [{ customerId: userId }, { sellerId: userId }],
        status: { in: ['pending', 'confirmed', 'processing', 'shipped'] as any },
      },
    })

    if (pending > 0) {
      return badRequest(
        `You have ${pending} pending orders. Resolve these before deleting your account.`,
        { pendingOrders: pending },
        requestId,
      )
    }

    const anonEmail = `deleted-${userId.slice(0, 8)}@deleted.farmcon.local`
    const anonName = 'Deleted User'

    await prisma.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { userId } }).catch(() => null)
      await tx.notification.deleteMany({ where: { userId } }).catch(() => null)
      await tx.review.deleteMany({ where: { reviewerId: userId } }).catch(() => null)

      await tx.cropListing
        .updateMany({ where: { farmerId: userId }, data: { isActive: false } })
        .catch(() => null)

      await tx.profile.update({
        where: { id: userId },
        data: {
          email: anonEmail,
          fullName: anonName,
          phone: null,
          address: null,
          city: null,
          state: null,
          pincode: null,
          gstNumber: null,
          aadharNumber: null,
          panNumber: null,
          isVerified: false,
          isActive: false,
        } as any,
      })

      await tx.farmerProfile
        .update({
          where: { id: userId },
          data: {
            farmName: null,
            farmLocation: null,
            bankAccountNumber: null,
            ifscCode: null,
          } as any,
        })
        .catch(() => null)

      if (auth.user.email) {
        await tx.newsletterSubscription
          .update({
            where: { email: auth.user.email },
            data: { isActive: false, unsubscribedAt: new Date() } as any,
          })
          .catch(() => null)
      }
    })

    logger.info('gdpr.delete', {
      userId,
      requestId,
      reason: parsed.data.reason,
    })

    return ok(
      {
        message:
          'Your account has been anonymised. Order history is retained (anonymised) per regulation.',
        anonymisedAt: new Date().toISOString(),
      },
      { status: 200 },
    )
  } catch (error) {
    logger.error('gdpr.delete.failed', {
      userId,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return serverError(
      'Failed to delete account',
      error instanceof Error ? error.message : undefined,
      requestId,
    )
  }
})
