'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Lock,
  Mail,
  Shield,
  Sprout,
  TrendingUp,
} from 'lucide-react'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { supabase } from '@/lib/supabase'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950">
      <div className="text-center">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-emerald-700" />
          <div className="absolute inset-0 rounded-full border-4 border-emerald-300 border-t-transparent animate-spin" />
          <Sprout className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-300" />
        </div>
        <p className="mt-4 text-sm font-semibold text-emerald-200">Loading…</p>
      </div>
    </div>
  )
}

function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { executeRecaptcha } = useGoogleReCaptcha()

  useEffect(() => {
    const run = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/dashboard')
          return
        }
      } catch (err) {
        console.error('Auth check failed:', err)
      } finally {
        setCheckingAuth(false)
      }
    }
    run()
  }, [router])

  useEffect(() => {
    const emailParam = searchParams?.get('email')
    if (emailParam) setEmail(decodeURIComponent(emailParam))
    const messageParam = searchParams?.get('message')
    if (messageParam) setMessage(decodeURIComponent(messageParam))
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (authError) {
        setError(authError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        let recaptchaToken = 'skip'
        if (executeRecaptcha) {
          try {
            recaptchaToken = await executeRecaptcha('send_otp')
          } catch (err) {
            console.error('reCAPTCHA error:', err)
          }
        }

        const otpResponse = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, recaptchaToken }),
        })

        const otpData = await otpResponse.json()

        if (!otpResponse.ok) {
          setError(otpData.error || 'Failed to send OTP')
          setLoading(false)
          return
        }

        await supabase.auth.signOut()
        router.push(
          `/auth/verify-otp?email=${encodeURIComponent(email)}&password=${encodeURIComponent(password)}`,
        )
      }
    } catch (err) {
      setError(`Something went wrong: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  if (checkingAuth) return <LoadingScreen />

  return (
    <AuthShell
      title="Welcome back"
      subtitle={
        <>
          New to FarmCon?{' '}
          <Link href="/auth/signup" className="font-bold text-emerald-300 hover:text-white transition-colors">
            Create an account
          </Link>
        </>
      }
      heroTitle={
        <>
          Grow smarter, sell faster — with{' '}
          <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            FarmCon.
          </span>
        </>
      }
      heroSubtitle="Continue managing crops, mandi prices, and orders from a single powerful workspace."
      heroBullets={[
        { icon: <Sprout className="w-5 h-5 text-white" />, text: 'Track crop lifecycle end-to-end' },
        { icon: <TrendingUp className="w-5 h-5 text-white" />, text: 'Live mandi prices across India' },
        { icon: <Shield className="w-5 h-5 text-white" />, text: 'Bank-grade security + OTP' },
      ]}
      footer={
        <>
          Protected by reCAPTCHA ·{' '}
          <Link href="/privacy-policy" className="text-emerald-300 hover:text-white">
            Privacy
          </Link>
          {' · '}
          <Link href="/terms-of-service" className="text-emerald-300 hover:text-white">
            Terms
          </Link>
        </>
      }
      compact
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <Alert tone="error">{error}</Alert>}
        {message && <Alert tone="success">{message}</Alert>}

        <div>
          <Label htmlFor="email" required>
            <Mail className="w-3.5 h-3.5 text-emerald-600" />
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <Label htmlFor="password" required>
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Password
          </Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
          />
        </div>

        <div className="flex justify-end">
          <Link
            href="/auth/forgot-password"
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            Forgot password?
          </Link>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Signing in…</span>
            </>
          ) : (
            <>
              <span>Sign in</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-emerald-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="px-3 bg-white text-xs font-semibold uppercase tracking-wider text-emerald-600">
              Or
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={() => router.push('/auth/email-otp')}
        >
          <Mail className="w-4 h-4" />
          <span>Sign in with Email OTP</span>
        </Button>
      </form>
    </AuthShell>
  )
}

export default function SignIn() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
      scriptProps={{ async: true, defer: true, appendTo: 'head' }}
    >
      <Suspense fallback={<LoadingScreen />}>
        <SignInForm />
      </Suspense>
    </GoogleReCaptchaProvider>
  )
}
