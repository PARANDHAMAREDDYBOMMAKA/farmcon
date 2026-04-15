'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Sprout, Sparkles } from 'lucide-react'
import { cn } from '@/lib/cn'

export function AuthShell({
  title,
  subtitle,
  heroTitle,
  heroSubtitle,
  heroBullets,
  heroImage = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=1400&auto=format&fit=crop',
  footer,
  compact,
  children,
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  heroTitle?: React.ReactNode
  heroSubtitle?: React.ReactNode
  heroBullets?: { icon: React.ReactNode; text: string }[]
  heroImage?: string
  footer?: React.ReactNode
  compact?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[30rem] h-[30rem] bg-emerald-500/20 rounded-full blur-3xl fc-blob" />
        <div className="absolute bottom-0 right-1/4 w-[30rem] h-[30rem] bg-teal-500/20 rounded-full blur-3xl fc-blob" style={{ animationDelay: '3s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-emerald-600/10 rounded-full blur-3xl" />
      </div>

      <Link href="/" className="absolute top-6 left-6 z-50 flex items-center gap-3 group">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl shadow-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
          <Sprout className="w-6 h-6 text-white" />
        </div>
        <div className="leading-none">
          <span className="text-xl font-extrabold text-white">FarmCon</span>
          <div className="flex items-center gap-1 mt-0.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">Smart Agri OS</span>
          </div>
        </div>
      </Link>

      {heroTitle && (
        <div className="hidden lg:flex lg:w-1/2 relative">
          <Image
            src={heroImage}
            alt=""
            fill
            priority
            sizes="50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/95 via-emerald-900/85 to-teal-950/90" />

          <div className="relative z-10 flex flex-col justify-center px-16 text-white">
            <div className="max-w-lg">
              <h2 className="text-5xl font-extrabold leading-[1.05] mb-6">
                {heroTitle}
              </h2>
              {heroSubtitle && (
                <p className="text-lg text-emerald-100/90 mb-10 leading-relaxed">
                  {heroSubtitle}
                </p>
              )}

              {heroBullets && heroBullets.length > 0 && (
                <div className="space-y-3">
                  {heroBullets.map((b, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 bg-white/8 backdrop-blur-md rounded-2xl p-4 ring-1 ring-white/15 hover:bg-white/12 transition-colors"
                    >
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg flex-shrink-0">
                        {b.icon}
                      </div>
                      <span className="text-base font-semibold">{b.text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div
        className={cn(
          'w-full flex items-center justify-center px-6 py-20 lg:py-12 relative z-10',
          heroTitle ? 'lg:w-1/2' : '',
        )}
      >
        <div className={cn('w-full', compact ? 'max-w-md' : 'max-w-lg')}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-emerald-200">{subtitle}</p>}
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/20 ring-1 ring-white/10">
            {children}
          </div>

          {footer && <div className="mt-6 text-center text-sm text-emerald-200">{footer}</div>}
        </div>
      </div>
    </div>
  )
}
