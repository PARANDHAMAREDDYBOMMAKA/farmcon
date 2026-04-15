import Link from 'next/link'
import { Zap } from 'lucide-react'
import { cn } from '@/lib/cn'

type Tone = 'emerald' | 'amber' | 'sky' | 'rose' | 'teal' | 'violet'

const toneGrad: Record<Tone, string> = {
  emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-400 to-orange-500',
  sky: 'from-sky-500 to-blue-600',
  rose: 'from-rose-500 to-pink-500',
  teal: 'from-teal-500 to-emerald-600',
  violet: 'from-violet-500 to-indigo-500',
}

export type QuickAction = {
  label: string
  href: string
  icon: React.ElementType
  tone?: Tone
}

export function QuickActions({
  title = 'Quick actions',
  actions,
}: {
  title?: string
  actions: QuickAction[]
}) {
  return (
    <div className="bg-white rounded-2xl ring-1 ring-emerald-100 shadow-sm p-6">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-md">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-lg font-bold text-emerald-950">{title}</h3>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {actions.map((a) => {
          const Icon = a.icon
          return (
            <Link
              key={a.href + a.label}
              href={a.href}
              className={cn(
                'group relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br shadow-md',
                'hover:shadow-2xl hover:-translate-y-1 transition-all duration-300',
                toneGrad[a.tone || 'emerald'],
              )}
            >
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/20 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500" />
              <div className="relative flex flex-col items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/25 backdrop-blur-sm flex items-center justify-center">
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-white leading-snug">{a.label}</span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
