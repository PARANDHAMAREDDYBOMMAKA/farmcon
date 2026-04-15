'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Mail, MailCheck, Sprout } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Alert } from '@/components/ui/alert'

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

function VerifyEmailInternal() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [tone, setTone] = useState<'success' | 'error'>('success')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) setEmail(decodeURIComponent(emailParam))

    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) router.push('/dashboard')
    }
    check()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) router.push('/dashboard')
    })

    return () => subscription.unsubscribe()
  }, [router, searchParams])

  const resendEmail = async () => {
    if (!email) return
    setLoading(true)
    setMessage('')
    try {
      const { error } = await supabase.auth.resend({ type: 'signup', email })
      if (error) {
        setTone('error')
        setMessage(error.message)
      } else {
        setTone('success')
        setMessage('Verification email sent. Check your inbox.')
      }
    } catch {
      setTone('error')
      setMessage('Failed to resend. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Verify your email"
      subtitle={email ? <>We sent a verification link to <strong className="text-emerald-300">{email}</strong></> : 'We sent a verification link to your inbox.'}
      compact
    >
      <div className="flex flex-col items-center text-center gap-6 py-2">
        <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
          <MailCheck className="w-9 h-9 text-emerald-600" />
        </div>

        <div className="space-y-2">
          <p className="text-base text-emerald-900 font-semibold">
            Click the link in the email to verify and start using FarmCon.
          </p>
          <p className="text-xs font-medium text-slate-500">
            The link expires in 24 hours.
          </p>
        </div>

        {message && <Alert tone={tone}>{message}</Alert>}

        <Button
          type="button"
          variant="outline"
          size="lg"
          className="w-full"
          onClick={resendEmail}
          disabled={loading || !email}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending…</span>
            </>
          ) : (
            <>
              <Mail className="w-4 h-4" />
              <span>Resend verification email</span>
            </>
          )}
        </Button>

        <Link
          href="/auth/signin"
          className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          Already verified? Sign in 
        </Link>
      </div>
    </AuthShell>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <VerifyEmailInternal />
    </Suspense>
  )
}
