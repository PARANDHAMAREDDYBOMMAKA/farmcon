import type { NextRequest } from 'next/server'
import { PLANS } from '@/lib/billing/plans'
import { ok, withLogging } from '@/lib/api'

export const GET = withLogging(async (_request: NextRequest) => {
  const plans = Object.values(PLANS).map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    priceInr: p.priceInr,
    interval: p.interval,
    highlight: !!p.highlight,
    features: p.features,
    limits: p.limits,
    available: p.id === 'free' || !!p.stripePriceId,
  }))
  return ok({ plans })
})
