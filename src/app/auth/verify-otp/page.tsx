'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, Loader2, ShieldCheck, Sprout, Clock } from 'lucide-react'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { supabase } from '@/lib/supabase'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'
import { cn } from '@/lib/cn'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950">
      <div className="text-center">
        <div className="relative w-14 h-14 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-700" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-300 border-t-transparent animate-spin" />
          <Sprout className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300" />
        </div>
        <p className="mt-3 text-sm font-semibold text-emerald-200">Loading…</p>
      </div>
    </div>
  )
}

function OtpInput({
  value,
  onChange,
  length = 6,
  autoFocus,
}: {
  value: string
  onChange: (v: string) => void
  length?: number
  autoFocus?: boolean
}) {
  const refs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus()
  }, [autoFocus])

  const handleChange = (i: number, next: string) => {
    const digit = next.replace(/\D/g, '').slice(-1)
    const arr = value.split('')
    while (arr.length < length) arr.push('')
    arr[i] = digit
    const joined = arr.join('').slice(0, length)
    onChange(joined)
    if (digit && i < length - 1) refs.current[i + 1]?.focus()
  }

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[i] && i > 0) {
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && i > 0) {
      refs.current[i - 1]?.focus()
    } else if (e.key === 'ArrowRight' && i < length - 1) {
      refs.current[i + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length)
    if (!pasted) return
    onChange(pasted.padEnd(length, ''))
    const last = Math.min(pasted.length, length - 1)
    refs.current[last]?.focus()
  }

  return (
    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handlePaste}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] ?? ''}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKey(i, e)}
          className={cn(
            'w-11 h-14 sm:w-12 sm:h-16 text-center text-2xl font-extrabold rounded-xl border-2 transition-all',
            'border-emerald-100 bg-emerald-50/40 text-emerald-950',
            'focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/15 focus:bg-white',
            value[i] && 'border-emerald-400 bg-white',
          )}
          aria-label={`Digit ${i + 1}`}
        />
      ))}
    </div>
  )
}

function VerifyOTPForm() {
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cooldown, setCooldown] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { executeRecaptcha } = useGoogleReCaptcha()

  useEffect(() => {
    const emailParam = searchParams?.get('email')
    const passwordParam = searchParams?.get('password')

    if (!emailParam) {
      setError('No email provided. Redirecting…')
      setTimeout(() => router.push('/auth/signin'), 1600)
      return
    }
    setEmail(decodeURIComponent(emailParam))
    if (passwordParam) setPassword(decodeURIComponent(passwordParam))
  }, [searchParams, router])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const verify = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (otp.length !== 6) {
      setError('Please enter all 6 digits.')
      return
    }
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Invalid OTP')

      setSuccess('Verified! Signing you in…')

      if (password) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) {
          setError(signInError.message)
          setLoading(false)
          return
        }
      }

      setTimeout(() => router.push('/dashboard'), 900)
    } catch (err: any) {
      setError(err?.message || 'Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resend = async () => {
    if (cooldown > 0) return
    setResending(true)
    setError('')
    setSuccess('')
    try {
      let recaptchaToken = 'skip'
      if (executeRecaptcha) {
        try {
          recaptchaToken = await executeRecaptcha('resend_otp')
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
      if (!res.ok) throw new Error(data.error || 'Failed to resend OTP')

      setSuccess('OTP resent. Check your inbox.')
      setCooldown(30)
    } catch (err: any) {
      setError(err?.message || 'Failed to resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthShell
      title="Enter verification code"
      subtitle={<>We sent a 6-digit code to <strong className="text-emerald-300">{email || 'your email'}</strong></>}
      heroTitle={
        <>
          Just one more{' '}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            step.
          </span>
        </>
      }
      heroSubtitle="Two-factor verification keeps your FarmCon account — and your farm data — secure."
      heroBullets={[
        { icon: <ShieldCheck className="w-5 h-5 text-white" />, text: 'Encrypted end-to-end' },
        { icon: <Clock className="w-5 h-5 text-white" />, text: 'Code expires in 5 minutes' },
        { icon: <Sprout className="w-5 h-5 text-white" />, text: 'Used by 10,000+ farmers' },
      ]}
      compact
    >
      <form onSubmit={verify} className="space-y-6">
        {error && <Alert tone="error">{error}</Alert>}
        {success && <Alert tone="success">{success}</Alert>}

        <div className="space-y-3">
          <OtpInput value={otp} onChange={setOtp} autoFocus />
          <p className="text-center text-xs font-medium text-slate-500">
            Paste the code from your email — we’ll auto-split the digits.
          </p>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading || otp.length !== 6}>
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Verifying…</span>
            </>
          ) : (
            <span>Verify & continue</span>
          )}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 hover:text-emerald-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <button
            type="button"
            onClick={resend}
            disabled={resending || cooldown > 0}
            className="font-semibold text-emerald-700 hover:text-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {resending ? 'Resending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
          </button>
        </div>
      </form>
    </AuthShell>
  )
}

export default function VerifyOTP() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
      scriptProps={{ async: true, defer: true, appendTo: 'head' }}
    >
      <Suspense fallback={<LoadingScreen />}>
        <VerifyOTPForm />
      </Suspense>
    </GoogleReCaptchaProvider>
  )
}
