'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, KeyRound, Loader2, Mail } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input, Label } from '@/components/ui/input'
import { Alert } from '@/components/ui/alert'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : ''
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${currentOrigin}/auth/reset-password`,
      })

      if (authError) setError(authError.message)
      else setMessage('Check your inbox — we’ve sent a password reset link.')
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="We’ll email you a secure link to set a new one."
      compact
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <Alert tone="error">{error}</Alert>}
        {message && <Alert tone="success">{message}</Alert>}

        <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
            <KeyRound className="w-5 h-5" />
          </div>
          <div className="text-sm text-emerald-800 font-medium">
            Enter the email you used to sign up. The link expires in 15 minutes.
          </div>
        </div>

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

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Sending link…</span>
            </>
          ) : (
            <>
              <span>Send reset link</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </Button>

        <div className="text-center">
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  )
}
