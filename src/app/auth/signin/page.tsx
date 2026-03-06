'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { GoogleReCaptchaProvider, useGoogleReCaptcha } from 'react-google-recaptcha-v3'
import { Sprout, Mail, Lock, ArrowRight, Sparkles, Shield, TrendingUp, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

function SignInForm() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { executeRecaptcha } = useGoogleReCaptcha()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          router.push('/dashboard')
          return
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setCheckingAuth(false)
      }
    }

    checkAuth()
  }, [router])

  useEffect(() => {
    const emailParam = searchParams?.get('email')
    if (emailParam) {
      setFormData(prev => ({ ...prev, email: decodeURIComponent(emailParam) }))
    }

    const messageParam = searchParams?.get('message')
    if (messageParam) {
      setMessage(decodeURIComponent(messageParam))
    }
  }, [searchParams])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      if (data.user) {
        let recaptchaToken = 'skip'
        if (executeRecaptcha) {
          try {
            recaptchaToken = await executeRecaptcha('send_otp')
          } catch (recaptchaErr) {
            console.error('reCAPTCHA error:', recaptchaErr)
          }
        }

        const otpResponse = await fetch('/api/auth/send-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            recaptchaToken
          }),
        })

        const otpData = await otpResponse.json()

        if (!otpResponse.ok) {
          setError(otpData.error || 'Failed to send OTP')
          setLoading(false)
          return
        }

        await supabase.auth.signOut()
        router.push(`/auth/verify-otp?email=${encodeURIComponent(formData.email)}&password=${encodeURIComponent(formData.password)}`)
      }
    } catch (err) {
      setError(`An unexpected error occurred: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setLoading(false)
    }
  }

  const handleEmailOTP = () => {
    router.push('/auth/email-otp')
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin"></div>
            <Sprout className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
          </div>
          <p className="mt-4 text-emerald-700 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-600/10 rounded-full blur-3xl"></div>
      </div>

      <Link href="/" className="absolute top-6 left-6 z-50 flex items-center gap-3 group">
        <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/30 group-hover:scale-110 transition-transform duration-300">
          <Sprout className="w-6 h-6 text-white" />
        </div>
        <div>
          <span className="text-2xl font-bold text-white">FarmCon</span>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">Premium</span>
          </div>
        </div>
      </Link>

      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1200&h=1600&fit=crop"
          alt="Farming"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/80 to-teal-900/90"></div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="max-w-lg">
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Welcome Back to
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                FarmCon
              </span>
            </h2>
            <p className="text-xl text-emerald-100/90 mb-10 leading-relaxed">
              Continue managing your crops and growing your agricultural business with smart technology.
            </p>

            <div className="space-y-4">
              {[
                { icon: <Sprout className="w-6 h-6" />, text: 'Track your crop progress', color: 'from-emerald-400 to-emerald-500' },
                { icon: <TrendingUp className="w-6 h-6" />, text: 'Monitor market prices', color: 'from-teal-400 to-teal-500' },
                { icon: <Shield className="w-6 h-6" />, text: 'Secure & trusted platform', color: 'from-cyan-400 to-cyan-500' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-4 bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 hover:bg-white/15 transition-all duration-300">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                    {item.icon}
                  </div>
                  <span className="text-lg font-medium">{item.text}</span>
                </div>
              ))}
            </div>

            <div className="mt-10 flex items-center gap-4">
              <div className="flex -space-x-3">
                {['P', 'R', 'A', 'M'].map((letter, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white text-sm font-bold border-2 border-emerald-900">
                    {letter}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold">10,000+ Farmers</p>
                <p className="text-emerald-200 text-sm">Already growing with us</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative z-10">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Sign in to your account
            </h2>
            <p className="text-emerald-200">
              Don&apos;t have an account?{' '}
              <Link href="/auth/signup" className="font-semibold text-emerald-300 hover:text-white transition-colors">
                Sign up for free
              </Link>
            </p>
          </div>

          <div className="bg-white rounded-3xl p-8 shadow-2xl shadow-black/20">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {message && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{message}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    Email Address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full px-4 py-3.5 border-2 border-emerald-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-2">
                    <Lock className="w-4 h-4 text-emerald-600" />
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="block w-full px-4 py-3.5 border-2 border-emerald-100 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                    placeholder="Enter your password"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-base font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign in</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-emerald-100" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-emerald-600 font-medium">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleEmailOTP}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200"
              >
                <Mail className="w-5 h-5" />
                <span>Sign in with Email OTP</span>
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-sm text-emerald-200">
            Protected by reCAPTCHA and subject to our{' '}
            <Link href="/privacy-policy" className="text-emerald-300 hover:text-white transition-colors">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function SignIn() {
  return (
    <GoogleReCaptchaProvider
      reCaptchaKey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''}
      scriptProps={{
        async: true,
        defer: true,
        appendTo: 'head',
      }}
    >
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900">
          <div className="text-center">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full border-4 border-emerald-700"></div>
              <div className="absolute inset-0 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin"></div>
              <Sprout className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-400" />
            </div>
            <p className="mt-4 text-emerald-300 font-medium">Loading...</p>
          </div>
        </div>
      }>
        <SignInForm />
      </Suspense>
    </GoogleReCaptchaProvider>
  )
}
