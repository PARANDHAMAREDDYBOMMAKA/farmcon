import type { NextRequest } from 'next/server'
import { z } from 'zod'
import {
  badRequest,
  ok,
  parseBody,
  requireUser,
  serverError,
  withLogging,
} from '@/lib/api'
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  customerId: z.string().startsWith('cus_'),
  returnUrl: z.string().url().optional(),
})

export const POST = withLogging(async (request: NextRequest, { requestId }) => {
  if (!isStripeConfigured()) {
    return serverError('Billing is not configured yet', undefined, requestId)
  }

  const auth = await requireUser(request, { requestId })
  if (!auth.ok) return auth.response

  const parsed = await parseBody(request, bodySchema, requestId)
  if (!parsed.ok) return parsed.response

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://farmcon.in'

  try {
    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: parsed.data.customerId,
      return_url: parsed.data.returnUrl || `${appUrl}/dashboard/profile`,
    })
    logger.info('billing.portal.created', {
      userId: auth.user.id,
      sessionId: session.id,
      requestId,
    })
    return ok({ url: session.url })
  } catch (error) {
    logger.error('billing.portal.failed', {
      userId: auth.user.id,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return serverError(
      'Failed to open billing portal',
      error instanceof Error ? error.message : undefined,
      requestId,
    )
  }
})
