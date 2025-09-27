'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function VerifyEmailInternal() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const emailParam = searchParams.get('email')
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam))
    }

    // Handle email confirmation from URL
    const handleEmailConfirmation = async () => {
      const { data, error } = await supabase.auth.getSession()
      if (data.session) {
        router.push('/dashboard')
      }
    }

    handleEmailConfirmation()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.push('/dashboard')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, searchParams])

  const resendEmail = async () => {
    if (!email) return
    
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      })

      if (error) {
        setMessage(error.message)
      } else {
        setMessage('Verification email sent! Please check your inbox.')
      }
    } catch (err) {
      setMessage('Failed to resend verification email. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Link href="/" className="text-3xl font-bold text-green-600">
            FarmCon
          </Link>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We sent a verification link to your email address
          </p>
        </div>

        <div className="bg-white shadow rounded-lg px-6 py-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
              <span className="text-2xl">📧</span>
            </div>
            
            {email && (
              <p className="text-sm text-gray-600 mb-6">
                Check your email at <strong>{email}</strong> for a verification link.
              </p>
            )}

            <div className="space-y-4">
              <p className="text-sm text-gray-600">
                Click the link in the email to verify your account and start using FarmCon.
              </p>
              
              <p className="text-xs text-gray-500">
                The verification link will expire in 24 hours for security reasons.
              </p>
            </div>

            {message && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">{message}</p>
              </div>
            )}

            <div className="mt-6 space-y-3">
              <button
                onClick={resendEmail}
                disabled={loading || !email}
                className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Resend verification email'}
              </button>
              
              <div className="text-center">
                <Link
                  href="/auth/signin"
                  className="text-sm text-green-600 hover:text-green-500"
                >
                  Already verified? Sign in
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble?{' '}
            <Link href="/support" className="text-green-600 hover:text-green-500">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
export default function () {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyEmailInternal />
    </Suspense>
  )
}
