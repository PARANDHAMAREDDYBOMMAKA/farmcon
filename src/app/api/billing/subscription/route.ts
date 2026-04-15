import type { NextRequest } from 'next/server'
import { ok, requireUser, serverError, withLogging } from '@/lib/api'
import { getStripe, isStripeConfigured, toSubscriptionSnapshot } from '@/lib/billing/stripe'
import { getPlanByPriceId, PLANS } from '@/lib/billing/plans'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export const GET = withLogging(async (request: NextRequest, { requestId }) => {
  const auth = await requireUser(request, { requestId })
  if (!auth.ok) return auth.response

  if (!isStripeConfigured()) {
    return ok({ plan: PLANS.free, subscription: null, configured: false })
  }

  try {
    const stripe = getStripe()
    const customers = await stripe.customers.list({
      email: auth.user.email || undefined,
      limit: 1,
    })
    const customer = customers.data[0]
    if (!customer) {
      return ok({ plan: PLANS.free, subscription: null, configured: true })
    }

    const subs = await stripe.subscriptions.list({
      customer: customer.id,
      status: 'active',
      limit: 1,
    })
    const sub = subs.data[0]
    if (!sub) {
      return ok({
        plan: PLANS.free,
        subscription: null,
        customerId: customer.id,
        configured: true,
      })
    }

    const snapshot = toSubscriptionSnapshot(sub)
    const plan = snapshot.priceId ? getPlanByPriceId(snapshot.priceId) : null
    return ok({
      plan: plan || PLANS.free,
      subscription: snapshot,
      customerId: customer.id,
      configured: true,
    })
  } catch (error) {
    logger.error('billing.subscription.fetch.failed', {
      userId: auth.user.id,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return serverError(
      'Failed to fetch subscription',
      error instanceof Error ? error.message : undefined,
      requestId,
    )
  }
})
