import * as React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'emerald' | 'amber' | 'sky' | 'rose' | 'teal' | 'violet'

const tones: Record<Tone, { bar: string; iconBg: string; ring: string }> = {
  emerald: {
    bar: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
    ring: 'ring-emerald-100',
  },
  amber: {
    bar: 'bg-gradient-to-r from-amber-400 to-orange-500',
    iconBg: 'bg-gradient-to-br from-amber-400 to-orange-500',
    ring: 'ring-amber-100',
  },
  sky: {
    bar: 'bg-gradient-to-r from-sky-500 to-blue-600',
    iconBg: 'bg-gradient-to-br from-sky-500 to-blue-600',
    ring: 'ring-sky-100',
  },
  rose: {
    bar: 'bg-gradient-to-r from-rose-500 to-pink-500',
    iconBg: 'bg-gradient-to-br from-rose-500 to-pink-500',
    ring: 'ring-rose-100',
  },
  teal: {
    bar: 'bg-gradient-to-r from-teal-500 to-emerald-500',
    iconBg: 'bg-gradient-to-br from-teal-500 to-emerald-500',
    ring: 'ring-teal-100',
  },
  violet: {
    bar: 'bg-gradient-to-r from-violet-500 to-indigo-500',
    iconBg: 'bg-gradient-to-br from-violet-500 to-indigo-500',
    ring: 'ring-violet-100',
  },
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = 'emerald',
  hint,
  trend,
  className,
}: {
  label: string
  value: React.ReactNode
  icon: React.ElementType
  tone?: Tone
  hint?: string
  trend?: { value: string; direction: 'up' | 'down' }
  className?: string
}) {
  const t = tones[tone]
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-white ring-1 p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all',
        t.ring,
        className,
      )}
    >
      <div className={cn('absolute top-0 left-0 right-0 h-1', t.bar)} />
      <div className="flex items-center justify-between mb-3">
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shadow-md', t.iconBg)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <div
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold ring-1 ring-inset',
              trend.direction === 'up'
                ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
                : 'bg-rose-50 text-rose-700 ring-rose-200',
            )}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            {trend.value}
          </div>
        )}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-500 mb-1.5">
        {label}
      </p>
      <p className="text-3xl font-extrabold text-emerald-950 leading-none">{value}</p>
      {hint && <p className="mt-2 text-xs font-medium text-slate-500">{hint}</p>}
    </div>
  )
}
