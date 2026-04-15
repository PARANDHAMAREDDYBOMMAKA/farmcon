'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Sprout, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

const navLinks = [
  { href: '#features', label: 'Features' },
  { href: '#who', label: 'Who it’s for' },
  { href: '#pricing', label: 'Pricing' },
  { href: '/api-docs', label: 'API' },
]

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed top-0 inset-x-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-white/80 backdrop-blur-xl border-b border-emerald-100 shadow-sm'
          : 'bg-transparent',
      )}
    >
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <nav className="flex h-20 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/30 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Sprout className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-xl font-extrabold tracking-tight text-emerald-950">FarmCon</span>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600">Smart Agri OS</span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-8">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-sm font-semibold text-emerald-900 hover:text-emerald-600 transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/auth/signin"
              className="hidden sm:inline-flex text-sm font-semibold text-emerald-900 hover:text-emerald-600 transition-colors px-3 py-2"
            >
              Sign in
            </Link>
            <Button href="/auth/signup" size="md" className="hidden sm:inline-flex">
              Get started
            </Button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800"
              aria-label="Toggle menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>

        {open && (
          <div className="lg:hidden pb-6 pt-2 space-y-1">
            {navLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block px-4 py-3 rounded-xl text-sm font-semibold text-emerald-900 hover:bg-emerald-50"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-3 px-2 pt-3">
              <Button href="/auth/signin" variant="outline" className="flex-1">
                Sign in
              </Button>
              <Button href="/auth/signup" className="flex-1">
                Get started
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
