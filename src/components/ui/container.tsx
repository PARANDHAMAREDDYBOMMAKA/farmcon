import * as React from 'react'
import { cn } from '@/lib/cn'

export function Container({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-6 lg:px-8', className)} {...props}>
      {children}
    </div>
  )
}

export function Section({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <section className={cn('py-20 lg:py-28', className)} {...props}>
      {children}
    </section>
  )
}

export function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 ring-1 ring-emerald-200 px-3 py-1 text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
      {children}
    </span>
  )
}

export function SectionHeading({
  title,
  subtitle,
  eyebrow,
  align = 'center',
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  eyebrow?: React.ReactNode
  align?: 'center' | 'left'
}) {
  return (
    <div
      className={cn(
        'max-w-3xl space-y-4',
        align === 'center' ? 'mx-auto text-center' : 'text-left',
      )}
    >
      {eyebrow && <SectionEyebrow>{eyebrow}</SectionEyebrow>}
      <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-emerald-950">{title}</h2>
      {subtitle && <p className="text-lg text-slate-600 leading-relaxed">{subtitle}</p>}
    </div>
  )
}
