import Stripe from 'stripe'

let client: Stripe | null = null

export function getStripe(): Stripe {
  if (client) return client
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  client = new Stripe(secret, {
    apiVersion: '2025-09-30.clover' as any,
    typescript: true,
  })
  return client
}

export function isStripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY
}

export type SubscriptionSnapshot = {
  id: string
  status: Stripe.Subscription.Status
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  priceId: string | null
  customerId: string
}

export function toSubscriptionSnapshot(sub: Stripe.Subscription): SubscriptionSnapshot {
  const item = sub.items?.data?.[0]
  return {
    id: sub.id,
    status: sub.status,
    currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    priceId: item?.price?.id || null,
    customerId: typeof sub.customer === 'string' ? sub.customer : sub.customer.id,
  }
}
