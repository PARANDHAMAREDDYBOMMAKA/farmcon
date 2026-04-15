import * as React from 'react'
import { CheckCircle2, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'success' | 'error' | 'info'

const tones: Record<Tone, { wrap: string; icon: React.ElementType }> = {
  success: {
    wrap: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: CheckCircle2,
  },
  error: {
    wrap: 'bg-rose-50 border-rose-200 text-rose-800',
    icon: AlertCircle,
  },
  info: {
    wrap: 'bg-sky-50 border-sky-200 text-sky-800',
    icon: Info,
  },
}

export function Alert({
  tone = 'info',
  children,
  className,
}: {
  tone?: Tone
  children: React.ReactNode
  className?: string
}) {
  const { wrap, icon: Icon } = tones[tone]
  return (
    <div
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium',
        wrap,
        className,
      )}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <span className="flex-1">{children}</span>
    </div>
  )
}
