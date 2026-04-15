'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { ArrowRight, Sparkles, TrendingUp, ShieldCheck, Leaf } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Container } from '@/components/ui/container'

const heroImages = [
  {
    src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1400&auto=format&fit=crop',
    alt: 'Smart farming dashboard',
  },
  {
    src: 'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=1400&auto=format&fit=crop',
    alt: 'Indian farmer in the field',
  },
  {
    src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1400&auto=format&fit=crop',
    alt: 'Wheat harvest',
  },
  {
    src: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=1400&auto=format&fit=crop',
    alt: 'Organic vegetable farming',
  },
]

const trustChips = [
  { icon: TrendingUp, label: '+40% avg yield' },
  { icon: ShieldCheck, label: 'Bank-grade security' },
  { icon: Leaf, label: 'Works offline' },
]

export function Hero() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % heroImages.length), 4500)
    return () => clearInterval(t)
  }, [])

  return (
    <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.12),transparent_55%)]" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl fc-blob -z-10" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl fc-blob -z-10" style={{ animationDelay: '4s' }} />

      <Container>
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-emerald-200 px-4 py-1.5 shadow-sm">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                Built for Indian farmers
              </span>
            </div>

            <h1 className="text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight text-emerald-950 leading-[1.05]">
              Grow more.{' '}
              <span className="relative inline-block">
                <span className="relative z-10 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 bg-clip-text text-transparent">
                  Sell smarter.
                </span>
                <svg
                  aria-hidden
                  className="absolute -bottom-2 left-0 w-full h-3 text-amber-300"
                  viewBox="0 0 200 12"
                  preserveAspectRatio="none"
                >
                  <path d="M0 6 Q 50 0 100 6 T 200 6" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
                </svg>
              </span>
            </h1>

            <p className="text-lg lg:text-xl text-slate-700 leading-relaxed max-w-xl">
              The complete agri-tech OS for farmers, suppliers, and buyers.
              Live mandi prices, AI crop advisory, rentals, and instant payments — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button href="/auth/signup" size="xl">
                <span>Start for free</span>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              {trustChips.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="inline-flex items-center gap-2 rounded-full bg-white ring-1 ring-emerald-100 px-3 py-1.5 shadow-sm"
                >
                  <Icon className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-semibold text-emerald-900">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative lg:h-[620px] h-[460px]">
            <div className="relative h-full rounded-[2rem] overflow-hidden shadow-2xl shadow-emerald-900/20 ring-1 ring-emerald-100">
              {heroImages.map((img, i) => (
                <div
                  key={img.src}
                  className={`absolute inset-0 transition-opacity duration-1000 ${i === idx ? 'opacity-100' : 'opacity-0'}`}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/40 via-transparent to-transparent" />
                </div>
              ))}

              <div className="absolute top-6 left-6 flex items-center gap-2 rounded-full bg-white/95 backdrop-blur px-3 py-1.5 shadow-lg">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-emerald-900">Live mandi prices</span>
              </div>

              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                <div className="bg-white/95 backdrop-blur rounded-2xl px-5 py-4 shadow-xl">
                  <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Today’s best price</p>
                  <p className="text-2xl font-extrabold text-emerald-950 mt-0.5">₹2,340 <span className="text-sm font-semibold text-slate-600">/ quintal</span></p>
                  <p className="text-xs font-semibold text-amber-700 mt-1">Tomato · Kolar Mandi</p>
                </div>
                <div className="flex gap-1.5">
                  {heroImages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setIdx(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === idx ? 'w-8 bg-white' : 'w-1.5 bg-white/60'}`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -left-8 top-20 bg-white rounded-2xl shadow-2xl shadow-emerald-900/10 ring-1 ring-emerald-100 p-4 fc-float">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Yield forecast</p>
                  <p className="text-lg font-extrabold text-emerald-950 leading-none mt-0.5">+38%</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:block absolute -right-6 bottom-20 bg-white rounded-2xl shadow-2xl shadow-emerald-900/10 ring-1 ring-emerald-100 p-4 fc-float" style={{ animationDelay: '1.2s' }}>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {['P', 'R', 'A'].map((c) => (
                    <div key={c} className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-white text-xs font-bold flex items-center justify-center ring-2 ring-white">
                      {c}
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-xs font-bold text-emerald-950">10,000+ farmers</p>
                  <p className="text-[11px] font-semibold text-emerald-600">Growing with us</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
