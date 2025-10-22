'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { profileAPI, farmerAPI } from '@/lib/api-client'
import type { UserRole } from '@/types'
import { Wheat } from 'lucide-react'

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'consumer' as UserRole,
    address: '',
    city: '',
    state: '',
    pincode: '',
    businessName: '',
    gstNumber: '',
    farmName: '',
    farmLocation: '',
    farmSize: '',
    farmingExperience: '',
    farmingType: [] as string[],
    soilType: '',
    waterSource: [] as string[]
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingAuth, setCheckingAuth] = useState(true)
  const router = useRouter()

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            phone: formData.phone,
            role: formData.role,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode
          }
        }
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      } else if (data.user) {
        try {
          await profileAPI.upsertProfile({
            id: data.user.id,
            email: formData.email,
            fullName: formData.fullName,
            phone: formData.phone,
            role: formData.role as UserRole,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
            businessName: formData.businessName || undefined,
            gstNumber: formData.gstNumber || undefined
          })

          if (formData.role === 'farmer' && (formData.farmName || formData.farmSize)) {
            await farmerAPI.upsertFarmerProfile({
              id: data.user.id,
              farmName: formData.farmName || undefined,
              farmLocation: formData.farmLocation || undefined,
              farmSize: formData.farmSize ? parseFloat(formData.farmSize) : undefined,
              farmingExperience: formData.farmingExperience ? parseInt(formData.farmingExperience) : undefined,
              farmingType: formData.farmingType.length > 0 ? formData.farmingType : undefined,
              soilType: formData.soilType || undefined,
              waterSource: formData.waterSource.length > 0 ? formData.waterSource : undefined
            })
          }

          await supabase.auth.updateUser({
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              role: formData.role,
              city: formData.city,
              state: formData.state
            }
          })

          router.push('/dashboard?welcome=true')
        } catch (profileError: any) {
          setError(`Failed to create profile: ${profileError.message || 'Unknown error'}`)
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative">
      {/* Logo in top left corner */}
      <Link href="/" className="absolute top-6 left-6 z-50 inline-flex items-center space-x-2 bg-white px-4 py-2 rounded-xl shadow-lg hover:shadow-xl transition-all">
        <Wheat className="w-8 h-8 text-green-600" />
        <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          FarmCon
        </span>
      </Link>

      {}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&h=1600&fit=crop"
          alt="Agriculture"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-green-600/80 to-emerald-700/80 backdrop-blur-sm"></div>

        <div className="relative z-10 flex flex-col justify-center px-12 text-white">
          <div className="backdrop-blur-xl bg-white/10 rounded-3xl p-8 border border-white/20">
            <h2 className="text-5xl font-bold mb-6">Join the Revolution</h2>
            <p className="text-xl mb-8 opacity-90">
              Connect with thousands of farmers across India. Manage crops, track prices, and grow your business.
            </p>
            <div className="space-y-4">
              {[
                { icon: '💰', text: 'Real-time market prices' },
                { icon: '🌱', text: 'Smart crop management' },
                { icon: '🏪', text: 'Direct sales platform' }
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

      {}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-green-600 hover:text-green-500">
                Sign in
              </Link>
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/80 rounded-3xl p-8 border border-white/20 shadow-2xl">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                {}
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                    I am a *
                  </label>
                  <select
                    id="role"
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  >
                    <option value="consumer">Consumer (Buy crops and products)</option>
                    <option value="farmer">Farmer (Sell crops and buy supplies)</option>
                    <option value="supplier">Supplier (Sell agricultural supplies)</option>
                  </select>
                </div>

                {}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Email"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Phone *
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="+91 9876543210"
                    />
                  </div>
                </div>

                {}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                      City *
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      value={formData.city}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="City"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <input
                      id="state"
                      name="state"
                      type="text"
                      required
                      value={formData.state}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="State"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      value={formData.address}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Address"
                    />
                  </div>
                  <div>
                    <label htmlFor="pincode" className="block text-sm font-medium text-gray-700 mb-2">
                      Pincode *
                    </label>
                    <input
                      id="pincode"
                      name="pincode"
                      type="text"
                      required
                      value={formData.pincode}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="000000"
                    />
                  </div>
                </div>

                {}
                {formData.role === 'supplier' && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Business Details</h3>
                    <div>
                      <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                        Business Name
                      </label>
                      <input
                        id="businessName"
                        name="businessName"
                        type="text"
                        value={formData.businessName}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Your business name"
                      />
                    </div>
                    <div>
                      <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700 mb-2">
                        GST Number (Optional)
                      </label>
                      <input
                        id="gstNumber"
                        name="gstNumber"
                        type="text"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="GST number"
                      />
                    </div>
                  </div>
                )}

                {}
                {formData.role === 'farmer' && (
                  <div className="space-y-4 pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Farm Details</h3>
                    <div>
                      <label htmlFor="farmName" className="block text-sm font-medium text-gray-700 mb-2">
                        Farm Name
                      </label>
                      <input
                        id="farmName"
                        name="farmName"
                        type="text"
                        value={formData.farmName}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                        placeholder="Your farm name"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="farmSize" className="block text-sm font-medium text-gray-700 mb-2">
                          Farm Size (acres)
                        </label>
                        <input
                          id="farmSize"
                          name="farmSize"
                          type="number"
                          min="0"
                          step="0.1"
                          value={formData.farmSize}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          placeholder="Size"
                        />
                      </div>
                      <div>
                        <label htmlFor="farmingExperience" className="block text-sm font-medium text-gray-700 mb-2">
                          Experience (years)
                        </label>
                        <input
                          id="farmingExperience"
                          name="farmingExperience"
                          type="number"
                          min="0"
                          value={formData.farmingExperience}
                          onChange={handleChange}
                          className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                          placeholder="Years"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                      Password *
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Password"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm *
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                      placeholder="Confirm"
                    />
                  </div>
                </div>
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
                    Creating Account...
                  </div>
                ) : 'Create Account'}
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-transparent text-gray-500">Or</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Link
                  href="/auth/email-otp"
                  className="w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  <span className="mr-2">✉️</span>
                  Email OTP
                </Link>

                <Link
                  href="/auth/mobile-otp"
                  className="w-full inline-flex justify-center items-center py-3 px-4 border-2 border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
                >
                  <span className="mr-2">📱</span>
                  Mobile OTP
                </Link>
              </div>

              <p className="text-xs text-gray-500 text-center">
                By creating an account, you agree to our Terms of Service and Privacy Policy.
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
