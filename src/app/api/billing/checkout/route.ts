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
import { getPlan, type PlanId } from '@/lib/billing/plans'
import { getStripe, isStripeConfigured } from '@/lib/billing/stripe'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  planId: z.enum(['pro', 'business']),
  successUrl: z.string().url().optional(),
  cancelUrl: z.string().url().optional(),
})

export const POST = withLogging(async (request: NextRequest, { requestId }) => {
  if (!isStripeConfigured()) {
    return serverError('Billing is not configured yet', undefined, requestId)
  }

  const auth = await requireUser(request, { requestId })
  if (!auth.ok) return auth.response

  const parsed = await parseBody(request, bodySchema, requestId)
  if (!parsed.ok) return parsed.response

  const { planId, successUrl, cancelUrl } = parsed.data
  const plan = getPlan(planId as PlanId)
  if (!plan.stripePriceId) {
    return badRequest(`Plan ${plan.name} has no Stripe price configured`, undefined, requestId)
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://farmcon.in'
  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      customer_email: auth.user.email || undefined,
      client_reference_id: auth.user.id,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      success_url: successUrl || `${appUrl}/dashboard?billing=success`,
      cancel_url: cancelUrl || `${appUrl}/dashboard?billing=cancelled`,
      metadata: {
        userId: auth.user.id,
        planId: plan.id,
      },
      subscription_data: {
        metadata: {
          userId: auth.user.id,
          planId: plan.id,
        },
      },
    })

    logger.info('billing.checkout.created', {
      userId: auth.user.id,
      planId: plan.id,
      sessionId: session.id,
      requestId,
    })

    return ok({ url: session.url, sessionId: session.id })
  } catch (error) {
    logger.error('billing.checkout.failed', {
      userId: auth.user.id,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return serverError(
      'Failed to create checkout session',
      error instanceof Error ? error.message : undefined,
      requestId,
    )
  }
})
