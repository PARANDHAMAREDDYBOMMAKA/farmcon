export type PlanId = 'free' | 'pro' | 'business'

export type Plan = {
  id: PlanId
  name: string
  tagline: string
  priceInr: number
  interval: 'month' | 'year'
  stripePriceId: string | undefined
  features: string[]
  highlight?: boolean
  limits: {
    activeListings: number | 'unlimited'
    monthlyOrders: number | 'unlimited'
    prioritySupport: boolean
    marketIntelligence: 'basic' | 'advanced' | 'enterprise'
    seats: number
  }
}

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: 'free',
    name: 'Starter',
    tagline: 'For farmers getting started',
    priceInr: 0,
    interval: 'month',
    stripePriceId: undefined,
    features: [
      'Up to 5 active listings',
      'Mandi price browsing',
      '7-day weather forecast',
      'Basic AI crop advisory',
      'Email support',
    ],
    limits: {
      activeListings: 5,
      monthlyOrders: 20,
      prioritySupport: false,
      marketIntelligence: 'basic',
      seats: 1,
    },
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    tagline: 'For growing sellers',
    priceInr: 499,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PRO_MONTHLY,
    features: [
      'Unlimited active listings',
      'Priority mandi alerts',
      '15-day weather forecast',
      'Advanced AI crop advisory',
      'Variety-level price insights',
      'Chat support',
    ],
    highlight: true,
    limits: {
      activeListings: 'unlimited',
      monthlyOrders: 'unlimited',
      prioritySupport: true,
      marketIntelligence: 'advanced',
      seats: 3,
    },
  },
  business: {
    id: 'business',
    name: 'Business',
    tagline: 'For suppliers & cooperatives',
    priceInr: 1999,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS_MONTHLY,
    features: [
      'Everything in Pro',
      'Bulk order tooling',
      'Dedicated onboarding',
      'API access',
      'Custom branding',
      'Up to 10 team seats',
      '24/7 priority support',
    ],
    limits: {
      activeListings: 'unlimited',
      monthlyOrders: 'unlimited',
      prioritySupport: true,
      marketIntelligence: 'enterprise',
      seats: 10,
    },
  },
}

export function getPlan(id: PlanId): Plan {
  return PLANS[id] || PLANS.free
}

export function getPlanByPriceId(priceId: string): Plan | null {
  for (const plan of Object.values(PLANS)) {
    if (plan.stripePriceId === priceId) return plan
  }
  return null
}

export function listPaidPlans(): Plan[] {
  return Object.values(PLANS).filter((p) => p.priceInr > 0)
}
