'use client'

import { useState } from 'react'
import { Mail, ArrowRight, Loader2, CheckCircle2, AlertCircle, Lock } from 'lucide-react'
import { Container } from '@/components/ui/container'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'

export function Newsletter() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.includes('@')) {
      setStatus({ ok: false, message: 'Please enter a valid email address.' })
      return
    }
    setLoading(true)
    setStatus(null)
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setEmail('')
        setStatus({ ok: true, message: 'Subscribed. Check your inbox for a welcome note.' })
      } else {
        setStatus({ ok: false, message: data.error || 'Subscription failed. Try again.' })
      }
    } catch {
      setStatus({ ok: false, message: 'Network error. Try again in a moment.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="pricing" className="py-24 lg:py-32">
      <Container>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-emerald-950 shadow-2xl shadow-emerald-900/30">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(16,185,129,0.35),transparent_55%)]" />
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-teal-500/30 rounded-full blur-3xl fc-blob" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-500/30 rounded-full blur-3xl fc-blob" style={{ animationDelay: '3s' }} />

          <div className="relative grid lg:grid-cols-2 gap-10 p-10 lg:p-16 items-center">
            <div className="text-white space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/15 ring-1 ring-emerald-400/30 px-3 py-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-300 opacity-75" />
                  <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-200">
                  10,000+ subscribed
                </span>
              </div>

              <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight">
                Never miss a{' '}
                <span className="bg-gradient-to-r from-amber-300 to-emerald-300 bg-clip-text text-transparent">
                  mandi move.
                </span>
              </h2>
              <p className="text-lg text-emerald-100 leading-relaxed max-w-lg">
                Weekly price movements, weather alerts, and new feature drops — curated
                for your region.
              </p>

              <ul className="grid sm:grid-cols-2 gap-3 pt-2 text-sm">
                {['Live mandi alerts', 'Farming how-tos', 'Exclusive drops', 'No spam, ever'].map((b) => (
                  <li key={b} className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300 flex-shrink-0" />
                    <span className="text-emerald-100 font-medium">{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-8 shadow-2xl">
              <div className="text-center mb-6">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <Mail className="w-7 h-7 text-white" />
                </div>
                <h3 className="mt-4 text-2xl font-extrabold text-emerald-950">
                  Subscribe to the weekly
                </h3>
                <p className="text-sm text-slate-600 mt-1">Free. Unsubscribe anytime.</p>
              </div>

              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="newsletter-email">Email address</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
                    <Input
                      id="newsletter-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="farmer@example.com"
                      disabled={loading}
                      required
                      className="pl-10"
                    />
                  </div>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Subscribing…</span>
                    </>
                  ) : (
                    <>
                      <span>Get the newsletter</span>
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </Button>

                {status && (
                  <div
                    className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${
                      status.ok
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}
                  >
                    {status.ok ? (
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    )}
                    <span className="font-medium">{status.message}</span>
                  </div>
                )}

                <div className="flex items-start gap-2 text-xs text-slate-500 pt-1">
                  <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-emerald-500" />
                  <span>
                    By subscribing you agree to our{' '}
                    <a href="/privacy-policy" className="font-semibold text-emerald-700 hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
