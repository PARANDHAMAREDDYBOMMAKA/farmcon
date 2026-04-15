import Link from 'next/link'
import {
  Sprout,
  TrendingUp,
  ShoppingCart,
  Truck,
  Store,
  Smartphone,
  ArrowUpRight,
  CloudSun,
  Brain,
} from 'lucide-react'
import { Container, SectionHeading } from '@/components/ui/container'
import { Badge } from '@/components/ui/badge'

const features = [
  {
    icon: Sprout,
    title: 'Smart Crop Management',
    description: 'Plan, track and harvest with AI recommendations and disease alerts.',
    tone: 'emerald' as const,
  },
  {
    icon: TrendingUp,
    title: 'Live Market Prices',
    description: 'Real-time mandi prices across India. Sell at the right time, at the right place.',
    tone: 'amber' as const,
  },
  {
    icon: CloudSun,
    title: 'Hyperlocal Weather',
    description: '7-day hyperlocal forecasts, rainfall, and crop-risk alerts on your farm.',
    tone: 'sky' as const,
  },
  {
    icon: ShoppingCart,
    title: 'Input Marketplace',
    description: 'Certified seeds, fertilizers, and tools from verified suppliers at wholesale pricing.',
    tone: 'teal' as const,
  },
  {
    icon: Truck,
    title: 'Equipment Rental',
    description: 'Tractors, harvesters, drones. Rent what you need, when you need it.',
    tone: 'emerald' as const,
  },
  {
    icon: Store,
    title: 'Direct-to-Buyer Sales',
    description: 'Skip middlemen. Ship to restaurants, retailers, and households, with tracking.',
    tone: 'amber' as const,
  },
  {
    icon: Brain,
    title: 'AI Advisory',
    description: 'Voice and photo-based disease detection with actionable treatment plans.',
    tone: 'sky' as const,
  },
  {
    icon: Smartphone,
    title: 'Offline-first PWA',
    description: 'Works on low-end phones with patchy networks. Hindi, Tamil, Telugu + 10 more.',
    tone: 'teal' as const,
  },
]

const toneBg: Record<string, string> = {
  emerald: 'from-emerald-500 to-teal-600',
  amber: 'from-amber-400 to-amber-500',
  sky: 'from-sky-500 to-blue-600',
  teal: 'from-teal-500 to-emerald-600',
}

export function Features() {
  return (
    <section id="features" className="py-24 lg:py-32 bg-gradient-to-b from-white to-emerald-50/40">
      <Container>
        <SectionHeading
          eyebrow="Everything you need"
          title={
            <>
              One platform.{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                Every tool to farm smarter.
              </span>
            </>
          }
          subtitle="From first sowing to final sale — FarmCon replaces a dozen apps, notebooks, and middlemen."
        />

        <div className="mt-16 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className="group relative bg-white rounded-2xl p-6 ring-1 ring-emerald-100 hover:ring-emerald-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${toneBg[f.tone]} flex items-center justify-center shadow-lg shadow-emerald-500/20 mb-5`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-bold text-emerald-950 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
