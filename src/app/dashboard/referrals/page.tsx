'use client'

import { useEffect, useState } from 'react'
import { Copy, Gift, Loader2, Share2, Users, Wallet } from 'lucide-react'
import toast from 'react-hot-toast'
import { authedFetch } from '@/lib/authedFetch'
import { PageHeader } from '@/components/dashboard/PageHeader'
import { StatCard } from '@/components/dashboard/StatCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

type Stats = {
  code: string
  totalReferrals: number
  pendingCredits: number
  shareUrl: string
}

export default function ReferralsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      try {
        const res = await authedFetch('/api/referral/me')
        const data = await res.json()
        if (data?.ok) setStats(data.data)
        else toast.error(data?.error?.message || `Failed (${res.status})`)
      } catch {
        toast.error('Failed to load your referral info')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const copy = async (text: string, label = 'Copied') => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(label)
    } catch {
      toast.error('Copy failed')
    }
  }

  const share = async () => {
    if (!stats) return
    const shareData = {
      title: 'Join FarmCon',
      text: `I’m using FarmCon to track mandi prices and sell my crops directly. Use my code ${stats.code} to get ₹100 credit on your first order.`,
      url: stats.shareUrl,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {}
    } else {
      copy(stats.shareUrl, 'Link copied')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3 text-emerald-700 font-semibold">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading referrals…
        </div>
      </div>
    )
  }
  if (!stats) return null

  return (
    <div className="space-y-6">
      <PageHeader
        title="Refer & earn"
        description="Invite farmers, buyers, or suppliers. Both of you earn ₹100 credit when they place their first qualifying order."
      />

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 text-white p-6 sm:p-8 shadow-xl shadow-emerald-900/20">
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-amber-300/20 rounded-full blur-3xl" />
        <div className="relative grid lg:grid-cols-2 gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 ring-1 ring-white/30 px-3 py-1 text-xs font-bold uppercase tracking-wider">
              <Gift className="w-3.5 h-3.5" />
              Your referral code
            </div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-4xl sm:text-5xl font-extrabold font-mono tracking-[0.2em]">
                {stats.code}
              </span>
              <button
                onClick={() => copy(stats.code, 'Code copied')}
                className="h-11 w-11 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
                aria-label="Copy code"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="mt-3 text-sm text-emerald-100 max-w-sm">
              Share your code. When someone signs up and places their first order, you both earn
              <strong className="text-white"> ₹100 credit</strong>.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur ring-1 ring-white/20 rounded-2xl p-4">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-100 mb-2">
              Share link
            </p>
            <div className="flex items-center gap-2 bg-emerald-900/40 rounded-xl p-2.5">
              <span className="text-xs sm:text-sm font-mono text-white truncate flex-1">
                {stats.shareUrl}
              </span>
              <button
                onClick={() => copy(stats.shareUrl, 'Link copied')}
                className="h-8 px-2 rounded-lg bg-white/15 hover:bg-white/25 text-xs font-bold"
              >
                Copy
              </button>
            </div>
            <Button
              onClick={share}
              size="lg"
              variant="accent"
              className="w-full mt-3"
            >
              <Share2 className="w-4 h-4" />
              Share with friends
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total referrals"
          value={stats.totalReferrals}
          icon={Users}
          tone="emerald"
          hint="People who signed up with your code"
        />
        <StatCard
          label="Pending credits"
          value={`₹${stats.pendingCredits * 100}`}
          icon={Wallet}
          tone="amber"
          hint="Credits waiting to unlock on first order"
        />
      </div>

      <div className="bg-white rounded-2xl ring-1 ring-emerald-100 shadow-sm p-6">
        <h3 className="text-lg font-bold text-emerald-950 mb-4">How it works</h3>
        <ol className="space-y-3">
          {[
            'Share your code or link with anyone — family, neighbours, cooperatives.',
            'They sign up on FarmCon using your code.',
            'When they place their first qualifying order of ₹500 or more, both of you get ₹100 credit.',
            'Credits auto-apply on your next order. No caps, no expiry.',
          ].map((step, i) => (
            <li key={i} className={cn('flex items-start gap-3')}>
              <span className="w-7 h-7 rounded-full bg-emerald-500 text-white text-xs font-extrabold flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <span className="text-sm text-emerald-950 leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
