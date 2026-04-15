import * as React from 'react'
import { cn } from '@/lib/cn'

type Tone = 'emerald' | 'amber' | 'sky' | 'rose' | 'slate' | 'teal'

const tones: Record<Tone, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  rose: 'bg-rose-50 text-rose-700 ring-rose-200',
  slate: 'bg-slate-50 text-slate-700 ring-slate-200',
  teal: 'bg-teal-50 text-teal-700 ring-teal-200',
}

export function Badge({
  tone = 'emerald',
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
        tones[tone],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  )
}
