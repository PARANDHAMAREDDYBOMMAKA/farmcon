'use client'

import { useEffect, useState } from 'react'
import { Check, CreditCard, ExternalLink, Loader2, Sparkles, Zap } from 'lucide-react'
import toast from 'react-hot-toast'
import { authedFetch } from '@/lib/authedFetch'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/cn'

type Plan = {
  id: 'free' | 'pro' | 'business'
  name: string
  tagline: string
  priceInr: number
  interval: 'month' | 'year'
  features: string[]
  highlight?: boolean
  limits: Record<string, any>
  available: boolean
}

type SubscriptionResponse = {
  plan: Plan
  subscription: null | {
    id: string
    status: string
    currentPeriodEnd: string
    cancelAtPeriodEnd: boolean
    priceId: string | null
    customerId: string
  }
  customerId?: string
  configured: boolean
}

export default function BillingPage() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [sub, setSub] = useState<SubscriptionResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [action, setAction] = useState<string | null>(null)

  useEffect(() => {
    ;(async () => {
      try {
        const [plansRes, subRes] = await Promise.all([
          authedFetch('/api/billing/plans').then((r) => r.json()),
          authedFetch('/api/billing/subscription').then((r) => r.json()),
        ])
        setPlans(plansRes?.data?.plans || [])
        setSub(subRes?.data || null)
      } catch {
        toast.error('Failed to load billing info')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const upgrade = async (planId: 'pro' | 'business') => {
    setAction(planId)
    try {
      const res = await authedFetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })
      const data = await res.json()
      if (!res.ok || !data?.data?.url) {
        toast.error(data?.error?.message || 'Checkout failed')
        return
      }
      window.location.href = data.data.url
    } catch {
      toast.error('Checkout failed')
    } finally {
      setAction(null)
    }
  }

  const openPortal = async () => {
    if (!sub?.customerId) return
    setAction('portal')
    try {
      const res = await authedFetch('/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: sub.customerId }),
      })
      const data = await res.json()
      if (data?.data?.url) window.location.href = data.data.url
      else toast.error('Unable to open billing portal')
    } finally {
      setAction(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-emerald-700 font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading billing…
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing & plans"
        description="Upgrade to unlock advanced mandi intelligence, priority support, and team seats."
      />

      {sub && (
        <div className="bg-white rounded-2xl ring-1 ring-emerald-100 shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600">
              Current plan
            </p>
            <div className="flex items-center gap-2 mt-1">
              <h3 className="text-2xl font-extrabold text-emerald-950">{sub.plan.name}</h3>
              {sub.subscription && (
                <Badge tone="emerald">{sub.subscription.status}</Badge>
              )}
            </div>
            <p className="text-sm text-slate-600 mt-1">{sub.plan.tagline}</p>
            {sub.subscription && (
              <p className="text-xs text-slate-500 mt-2">
                Renews {new Date(sub.subscription.currentPeriodEnd).toLocaleDateString('en-IN')}
                {sub.subscription.cancelAtPeriodEnd ? ' · cancels at period end' : ''}
              </p>
            )}
            {!sub.configured && (
              <p className="text-xs text-amber-700 mt-2">
                Billing is not configured on this environment — set STRIPE_SECRET_KEY and plan price IDs to enable paid tiers.
              </p>
            )}
          </div>
          {sub.customerId && (
            <Button onClick={openPortal} variant="outline" disabled={action === 'portal'}>
              {action === 'portal' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Manage billing
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-5">
        {plans.map((plan) => {
          const isCurrent = sub?.plan.id === plan.id
          const Icon = plan.id === 'free' ? Sparkles : plan.id === 'pro' ? Zap : CreditCard
          return (
            <div
              key={plan.id}
              className={cn(
                'relative rounded-2xl bg-white ring-1 p-6 shadow-sm transition-all',
                plan.highlight
                  ? 'ring-emerald-400 shadow-lg shadow-emerald-500/15'
                  : 'ring-emerald-100',
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge tone="emerald" className="shadow">
                    Most popular
                  </Badge>
                </div>
              )}
              <div
                className={cn(
                  'w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-white shadow-md',
                  plan.id === 'free'
                    ? 'bg-gradient-to-br from-slate-500 to-slate-600'
                    : plan.id === 'pro'
                      ? 'bg-gradient-to-br from-emerald-500 to-teal-600'
                      : 'bg-gradient-to-br from-violet-500 to-indigo-600',
                )}
              >
                <Icon className="w-5 h-5" />
              </div>

              <h3 className="text-xl font-extrabold text-emerald-950">{plan.name}</h3>
              <p className="text-sm text-slate-600 mt-0.5">{plan.tagline}</p>

              <div className="mt-4 flex items-baseline gap-1.5">
                <span className="text-4xl font-extrabold text-emerald-950">
                  ₹{plan.priceInr.toLocaleString('en-IN')}
                </span>
                <span className="text-sm font-semibold text-slate-500">/{plan.interval}</span>
              </div>

              <ul className="mt-6 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-emerald-950">
                    <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                {isCurrent ? (
                  <Button variant="outline" className="w-full" disabled>
                    Current plan
                  </Button>
                ) : plan.id === 'free' ? (
                  <Button variant="outline" className="w-full" disabled>
                    Free forever
                  </Button>
                ) : (
                  <Button
                    onClick={() => upgrade(plan.id as 'pro' | 'business')}
                    className="w-full"
                    disabled={!plan.available || action === plan.id}
                  >
                    {action === plan.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Redirecting…
                      </>
                    ) : !plan.available ? (
                      'Coming soon'
                    ) : (
                      <>
                        Upgrade to {plan.name}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="bg-emerald-50 ring-1 ring-emerald-100 rounded-2xl p-5 text-sm text-emerald-900">
        <p className="font-bold mb-1">Need a custom plan?</p>
        <p className="text-emerald-800">
          For cooperatives, FPOs, or enterprise deployments with 20+ seats and bespoke integrations,
          email{' '}
          <a href="mailto:sales@farmcon.in" className="font-bold underline">
            sales@farmcon.in
          </a>{' '}
          and we’ll put together a quote within 24 hours.
        </p>
      </div>
    </div>
  )
}
