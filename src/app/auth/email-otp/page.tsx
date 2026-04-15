'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, Loader2, Lock, Mail, Shield, Sparkles } from 'lucide-react'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input, Label, FieldHint } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/cn'

function EmailOTPForm() {
  const [step, setStep] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const { executeRecaptcha } = useGoogleReCaptcha()

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address.')
      setLoading(false)
      return
    }

    try {
      let recaptchaToken = 'skip'
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('send_otp')
        } catch {
          recaptchaToken = 'skip'
        }
      }

      const res = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, recaptchaToken }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send OTP')

      setSuccess('Code sent. Check your inbox.')
      setStep('otp')
    } catch (err: any) {
      setError(err?.message || 'Failed to send OTP. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (otp.length !== 6) {
      setError('Please enter the 6-digit code.')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid OTP')

      setSuccess('Verified! Redirecting…')
      setTimeout(() => router.push('/dashboard'), 1200)
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title={step === 'email' ? 'Sign in with a code' : 'Enter your code'}
      subtitle={
        step === 'email' ? (
          <>
            Prefer a password?{' '}
            <Link href="/auth/signin" className="font-bold text-emerald-300 hover:text-white">
              Sign in with password
            </Link>
          </>
        ) : (
          <>We sent a 6-digit code to <strong className="text-emerald-300">{email}</strong></>
        )
      }
      heroTitle={
        <>
          Passwordless,{' '}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            frictionless.
          </span>
        </>
      }
      heroSubtitle="Log in with a one-time code — no password to forget, no password to leak."
      heroBullets={[
        { icon: <Mail className="w-5 h-5 text-white" />, text: 'Code delivered instantly' },
        { icon: <Shield className="w-5 h-5 text-white" />, text: 'Protected by reCAPTCHA' },
        { icon: <Sparkles className="w-5 h-5 text-white" />, text: 'No passwords. Ever.' },
      ]}
      compact
    >
      {step === 'email' ? (
        <form onSubmit={sendOtp} className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}

          <div>
            <Label htmlFor="email" required>
              <Mail className="w-3.5 h-3.5 text-emerald-600" />
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <FieldHint>We’ll send you a 6-digit code via email.</FieldHint>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending code…</span>
              </>
            ) : (
              <>
                <span>Send verification code</span>
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </Button>

          <p className="text-center text-xs text-slate-500">
            Protected by reCAPTCHA.{' '}
            <a href="https://policies.google.com/privacy" className="text-emerald-700 hover:underline font-semibold">
              Privacy
            </a>
            {' · '}
            <a href="https://policies.google.com/terms" className="text-emerald-700 hover:underline font-semibold">
              Terms
            </a>
          </p>
        </form>
      ) : (
        <form onSubmit={verifyOtp} className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}
          {success && <Alert tone="success">{success}</Alert>}

          <div>
            <Label htmlFor="otp" required>
              <Lock className="w-3.5 h-3.5 text-emerald-600" />
              Verification code
            </Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
              placeholder="••••••"
              className={cn('text-center text-3xl font-extrabold tracking-[0.5em] py-4')}
              autoFocus
            />
            <FieldHint>Enter the 6-digit code from your email.</FieldHint>
          </div>

          <Button type="submit" size="lg" className="w-full" disabled={loading || otp.length !== 6}>
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Verifying…</span>
              </>
            ) : (
              <span>Verify & sign in</span>
            )}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => {
                setStep('email')
                setOtp('')
                setError('')
                setSuccess('')
              }}
              className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-900"
            >
              <ArrowLeft className="w-4 h-4" />
              Change email
            </button>
            <button
              type="button"
              onClick={sendOtp}
              disabled={loading}
              className="font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50"
            >
              Resend code
            </button>
          </div>
        </form>
      )}
    </AuthShell>
  )
}

export default function EmailOTPPage() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
      scriptProps={{ async: true, defer: true, appendTo: 'head' }}
    >
      <EmailOTPForm />
    </GoogleReCaptchaProvider>
  )
}
