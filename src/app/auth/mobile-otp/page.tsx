'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Wheat, Smartphone, ArrowLeft } from 'lucide-react'
import Image from 'next/image'
import { auth } from '@/lib/firebase'
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult
} from 'firebase/auth'

export default function MobileOTPPage() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const router = useRouter()

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    // Basic phone number validation
    const cleanedPhone = phoneNumber.replace(/\D/g, '')
    if (cleanedPhone.length !== 10 || !cleanedPhone.match(/^[6-9]\d{9}$/)) {
      setError('Please enter a valid 10-digit Indian mobile number')
      setLoading(false)
      return
    }

    try {
      const formattedPhone = `+91${cleanedPhone}`
      console.log('Sending OTP to:', formattedPhone)

      // Clear any existing reCAPTCHA
      const container = document.getElementById('recaptcha-container')
      if (container) {
        container.innerHTML = ''
      }

      // Create RecaptchaVerifier with invisible reCAPTCHA (same as Examinato project)
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'invisible',
          callback: (response: any) => {
            console.log('reCAPTCHA solved:', response)
          }
        },
        auth
      )

      console.log('RecaptchaVerifier created, sending verification code...')

      // Firebase will send SMS automatically
      console.log('Calling signInWithPhoneNumber...')
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifier)

      // @ts-ignore - Store globally like Examinato project does
      window.confirmationResult = confirmation
      setConfirmationResult(confirmation)

      console.log('Firebase response:', {
        verificationId: confirmation.verificationId,
        phone: formattedPhone
      })

      setSuccess(`OTP sent to ${formattedPhone}! Check your phone.`)
      setStep('otp')
      console.log('✅ OTP request completed. Check your phone for SMS.')
      console.log('💡 If SMS not received, use test number: +919346688064 with OTP: 123456')
    } catch (err: any) {
      console.error('Error sending OTP:', err)

      // Handle specific errors
      if (err.code === 'auth/invalid-app-credential') {
        setError('Please ensure: 1) Phone Auth is enabled in Firebase Console, 2) Billing (Blaze plan) is enabled, 3) Domain is authorized')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else if (err.message && err.message.includes('badge')) {
        setError('reCAPTCHA error. Please try: 1) Disable ad blockers, 2) Use a different browser, or 3) Clear browser cache')
      } else {
        setError(err.message || 'Failed to send OTP. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      setLoading(false)
      return
    }

    try {
      // Use global confirmationResult like Examinato project
      // @ts-ignore
      const confirmation = window.confirmationResult || confirmationResult

      if (!confirmation) {
        setError('Please request a new OTP')
        setLoading(false)
        return
      }

      // Verify OTP with Firebase
      const result = await confirmation.confirm(otp)
      console.log('OTP verified successfully:', result.user.phoneNumber)

      // Now check backend for user account
      const formattedPhone = `+91${phoneNumber.replace(/\D/g, '')}`
      const response = await fetch('/api/auth/verify-mobile-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: formattedPhone,
          otp: 'firebase-verified',
          firebaseUid: result.user.uid,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.requiresSignup) {
          setError('No account found. Please sign up first.')
        } else {
          setError(data.error || 'Verification failed')
        }
        setLoading(false)
        return
      }

      setSuccess('Verified! Redirecting to dashboard...')

      setTimeout(() => {
        if (data.userType) {
          router.push(`/dashboard/${data.userType}`)
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }, 1500)
    } catch (err: any) {
      console.error('Error verifying OTP:', err)

      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.')
      } else if (err.code === 'auth/code-expired') {
        setError('OTP expired. Please request a new one.')
      } else {
        setError('Invalid OTP. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendOTP = async () => {
    setOtp('')
    await handleSendOTP({ preventDefault: () => {} } as React.FormEvent)
  }

  const handleChangePhone = () => {
    setOtp('')
    setError('')
    setSuccess('')
    setStep('phone')
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative">
      {/* Invisible reCAPTCHA container */}
      <div id="recaptcha-container"></div>

      {/* Logo in top left corner */}
      <Link href="/" className="absolute top-6 left-6 z-50 inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all">
        <Wheat className="w-8 h-8 text-green-600" />
        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          FarmCon
        </span>
      </Link>

      {/* Left side - Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1605000797499-95a51c5269ae?w=1200&h=1600&fit=crop"
          alt="Smartphone farming"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/80 to-emerald-700/80 backdrop-blur-sm"></div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
            <div className="flex items-center mb-6">
              <Smartphone className="w-12 h-12 mr-4" />
              <h2 className="text-5xl font-bold">Quick & Secure</h2>
            </div>
            <p className="text-xl mb-8 opacity-90">
              Sign in instantly with your mobile number. Firebase-powered OTP.
            </p>
            <div className="space-y-4">
              {[
                { icon: '🔒', text: 'Powered by Firebase' },
                { icon: '⚡', text: 'No password required' },
                { icon: '📱', text: 'Works with any Indian number' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center backdrop-blur-md bg-white/10 rounded-xl p-4 border border-white/20">
                  <div className="text-3xl mr-4">{item.icon}</div>
                  <span className="text-lg">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              {step === 'phone' ? 'Sign in with Mobile OTP' : 'Verify OTP'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {step === 'phone' ? (
                <>
                  Prefer password?{' '}
                  <Link href="/auth/signin" className="font-medium text-green-600 hover:text-green-500">
                    Sign in with password
                  </Link>
                </>
              ) : (
                `We sent a code to +91 ${phoneNumber}`
              )}
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/80 rounded-3xl p-8 border border-white/20 shadow-2xl">
            {step === 'phone' ? (
              <form className="space-y-6" onSubmit={handleSendOTP}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                    {success}
                  </div>
                )}

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 sm:text-sm">+91</span>
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      maxLength={10}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                      className="block w-full pl-14 pr-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="9876543210"
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Enter your 10-digit mobile number. Firebase will send an OTP.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending OTP...
                    </div>
                  ) : (
                    <>
                      <Smartphone className="w-5 h-5 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-transparent text-gray-500">Or</span>
                  </div>
                </div>

                <Link
                  href="/auth/email-otp"
                  className="w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  <span className="mr-2">✉️</span>
                  Sign in with Email OTP
                </Link>

                <p className="text-xs text-center text-gray-500">
                  Protected by Firebase & reCAPTCHA
                </p>
              </form>
            ) : (
              <form className="space-y-6" onSubmit={handleVerifyOTP}>
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-xl text-sm">
                    {success}
                  </div>
                )}

                <div>
                  <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    maxLength={6}
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-center text-2xl tracking-widest font-semibold transition-all"
                    placeholder="000000"
                    autoFocus
                  />
                  <p className="mt-2 text-xs text-gray-500 text-center">
                    Enter the 6-digit code sent via Firebase SMS
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verifying...
                    </div>
                  ) : 'Verify & Sign In'}
                </button>

                <div className="flex justify-between text-sm">
                  <button
                    type="button"
                    onClick={handleChangePhone}
                    className="flex items-center text-green-600 hover:text-green-500 font-medium transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Change number
                  </button>
                  <button
                    type="button"
                    onClick={handleResendOTP}
                    disabled={loading}
                    className="text-green-600 hover:text-green-500 font-medium disabled:opacity-50 transition-colors"
                  >
                    Resend code
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
