'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Lock, Sprout } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { AuthShell } from '@/components/auth/AuthShell'
import { Button } from '@/components/ui/button'
import { Input, Label, FieldHint } from '@/components/ui/input'
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

function ResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) router.push('/auth/signin')
    }
    checkSession()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.')
      return
    }

    setLoading(true)
    try {
      const { error: authError } = await supabase.auth.updateUser({ password })
      if (authError) {
        setError(authError.message)
      } else {
        setSuccess(true)
        setTimeout(() => router.push('/auth/signin?message=Password updated successfully'), 1800)
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <AuthShell title="Password updated" subtitle="Redirecting you to sign in…" compact>
        <div className="flex flex-col items-center gap-4 py-6 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <p className="text-base font-semibold text-emerald-900">
            Your password has been updated successfully.
          </p>
          <Link
            href="/auth/signin"
            className="text-sm font-bold text-emerald-700 hover:text-emerald-900"
          >
            Go to sign in 
          </Link>
        </div>
      </AuthShell>
    )
  }

  return (
    <AuthShell
      title="Set a new password"
      subtitle="Pick something strong you haven’t used before."
      compact
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        {error && <Alert tone="error">{error}</Alert>}

        <div>
          <Label htmlFor="password" required>
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            New password
          </Label>
          <Input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 6 characters"
          />
          <FieldHint>Use 8+ characters with a mix of letters, numbers, and symbols.</FieldHint>
        </div>

        <div>
          <Label htmlFor="confirmPassword" required>
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            Confirm password
          </Label>
          <Input
            id="confirmPassword"
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter your new password"
          />
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Updating…</span>
            </>
          ) : (
            <>
              <span>Update password</span>
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
