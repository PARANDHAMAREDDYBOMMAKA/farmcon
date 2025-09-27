'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { setupRecaptcha, sendPhoneOTP } from '@/lib/firebase'
import { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth'

export default function PhoneSignIn() {
  const [step, setStep] = useState<'phone' | 'otp'>('phone')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null)
  const router = useRouter()

  useEffect(() => {
    // Setup reCAPTCHA when component mounts
    if (!recaptchaVerifier) {
      const verifier = setupRecaptcha('recaptcha-container')
      setRecaptchaVerifier(verifier)
    }

    return () => {
      // Cleanup
      if (recaptchaVerifier) {
        recaptchaVerifier.clear()
      }
    }
  }, [recaptchaVerifier])

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate phone number format
    if (!phoneNumber.match(/^\+91\d{10}$/)) {
      setError('Please enter a valid Indian phone number (+91XXXXXXXXXX)')
      setLoading(false)
      return
    }

    try {
      if (!recaptchaVerifier) {
        setError('reCAPTCHA not initialized. Please refresh the page.')
        setLoading(false)
        return
      }

      const confirmation = await sendPhoneOTP(phoneNumber, recaptchaVerifier)
      setConfirmationResult(confirmation)
      setStep('otp')
    } catch (err: any) {
      console.error('Error sending OTP:', err)
      setError(err.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      setLoading(false)
      return
    }

    try {
      if (!confirmationResult) {
        setError('No OTP confirmation found. Please resend OTP.')
        setLoading(false)
        return
      }

      // Verify OTP with Firebase
      const firebaseResult = await confirmationResult.confirm(otp)
      const firebaseUser = firebaseResult.user

      if (firebaseUser) {
        // Create or get user in Supabase
        const { error } = await supabase.auth.signInWithPassword({
          email: `${phoneNumber.replace('+', '')}@phone.farmcon.app`,
          password: firebaseUser.uid // Use Firebase UID as password
        })

        if (error) {
          // If user doesn't exist, create a new one
          const { error: signUpError } = await supabase.auth.signUp({
            email: `${phoneNumber.replace('+', '')}@phone.farmcon.app`,
            password: firebaseUser.uid,
            options: {
              data: {
                phone: phoneNumber,
                phone_verified: true
              }
            }
          })

          if (signUpError) {
            throw signUpError
          }
        }

        router.push('/dashboard')
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err)
      setError('Invalid OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')
    
    // If starts with 91, add +
    if (digits.startsWith('91')) {
      return '+' + digits
    }
    // If starts with other digits, assume it needs +91
    else if (digits.length > 0) {
      return '+91' + digits
    }
    return ''
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setPhoneNumber(formatted)
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-400 to-green-600 relative">
        <div className="flex flex-col justify-center px-12 text-white">
          <h2 className="text-4xl font-bold mb-6">Quick Sign In</h2>
          <p className="text-xl mb-8 opacity-90">
            Sign in instantly with your phone number. Perfect for farmers on the go.
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>No password required</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Secure OTP verification</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Quick access to your farm</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="text-3xl font-bold text-green-600">
              FarmCon
            </Link>
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
              {step === 'phone' ? 'Sign in with Phone' : 'Verify OTP'}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {step === 'phone' ? (
                <>
                  Prefer email?{' '}
                  <Link href="/auth/signin" className="font-medium text-green-600 hover:text-green-500">
                    Sign in with email
                  </Link>
                </>
              ) : (
                `We sent a 6-digit code to ${phoneNumber}`
              )}
            </p>
          </div>

          {step === 'phone' ? (
            <form className="mt-8 space-y-6" onSubmit={handleSendOTP}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="+91 9876543210"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Enter your 10-digit mobile number
                </p>
              </div>

              {/* reCAPTCHA container - invisible */}
              <div id="recaptcha-container"></div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </form>
          ) : (
            <form className="mt-8 space-y-6" onSubmit={handleVerifyOTP}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
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
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
                <p className="mt-1 text-xs text-gray-500 text-center">
                  Enter the 6-digit code sent to your phone
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Verifying...' : 'Verify & Sign In'}
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-sm text-green-600 hover:text-green-500"
                >
                  ← Back to phone number
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}