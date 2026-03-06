'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { profileAPI, farmerAPI } from '@/lib/api-client'
import type { UserRole } from '@/types'
import {
  Sprout, Mail, Lock, User, Phone, MapPin, Building2,
  ArrowRight, Sparkles, Loader2, AlertCircle, Wheat, ShoppingCart, Store,
  TreeDeciduous, Clock
} from 'lucide-react'

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
    )
  }

  const roleOptions = [
    { value: 'consumer', label: 'Consumer', icon: <ShoppingCart className="w-5 h-5" />, desc: 'Buy crops and products' },
    { value: 'farmer', label: 'Farmer', icon: <Wheat className="w-5 h-5" />, desc: 'Sell crops and buy supplies' },
    { value: 'supplier', label: 'Supplier', icon: <Store className="w-5 h-5" />, desc: 'Sell agricultural supplies' }
  ]

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
          src="https://images.unsplash.com/photo-1560493676-04071c5f467b?w=1200&h=1600&fit=crop"
          alt="Agriculture"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/90 via-emerald-800/80 to-teal-900/90"></div>

        <div className="relative z-10 flex flex-col justify-center px-16 text-white">
          <div className="max-w-lg">
            <h2 className="text-5xl font-bold mb-6 leading-tight">
              Join the
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-teal-300">
                Revolution
              </span>
            </h2>
            <p className="text-xl text-emerald-100/90 mb-10 leading-relaxed">
              Connect with thousands of farmers across India. Manage crops, track prices, and grow your business.
            </p>

            <div className="grid grid-cols-2 gap-4 mb-10">
              {[
                { value: '10K+', label: 'Active Farmers' },
                { value: '₹500Cr+', label: 'Crops Sold' },
                { value: '40%', label: 'Yield Increase' },
                { value: '24/7', label: 'Support' }
              ].map((stat, idx) => (
                <div key={idx} className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/20 text-center">
                  <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-emerald-200">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {['🌾', '🛒', '📦', '⚙️'].map((emoji, i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-lg border-2 border-emerald-900">
                    {emoji}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold">All User Types</p>
                <p className="text-emerald-200 text-sm">Farmers, Consumers, Suppliers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 overflow-y-auto relative z-10">
        <div className="w-full max-w-lg">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-white mb-2">
              Create your account
            </h2>
            <p className="text-emerald-200">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-semibold text-emerald-300 hover:text-white transition-colors">
                Sign in
              </Link>
            </p>
          </div>

          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl shadow-black/20">
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-3">
                  <User className="w-4 h-4 text-emerald-600" />
                  I am a
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {roleOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, role: option.value as UserRole })}
                      className={`relative p-4 rounded-xl border-2 transition-all duration-200 text-center ${
                        formData.role === option.value
                          ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20'
                          : 'border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50'
                      }`}
                    >
                      <div className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2 ${
                        formData.role === option.value
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white'
                          : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {option.icon}
                      </div>
                      <p className={`text-sm font-semibold ${formData.role === option.value ? 'text-emerald-700' : 'text-emerald-900'}`}>
                        {option.label}
                      </p>
                      <p className="text-[10px] text-emerald-500 mt-0.5">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="fullName" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="email" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-2">
                    <Mail className="w-4 h-4 text-emerald-600" />
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-2">
                    <Phone className="w-4 h-4 text-emerald-600" />
                    Phone
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                    placeholder="+91 9876543210"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    State
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="address" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-2">
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    Address
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                    placeholder="Address"
                  />
                </div>
                <div>
                  <label htmlFor="pincode" className="flex items-center gap-2 text-sm font-semibold text-emerald-900 mb-2">
                    <MapPin className="w-4 h-4 text-emerald-600" />
                    Pincode
                  </label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                    placeholder="000000"
                  />
                </div>
              </div>

              {formData.role === 'supplier' && (
                <div className="pt-4 border-t-2 border-emerald-100 space-y-4">
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <Store className="w-4 h-4 text-emerald-600" />
                    Business Details
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="businessName" className="text-sm font-medium text-emerald-700 mb-2 block">
                        Business Name
                      </label>
                      <input
                        id="businessName"
                        name="businessName"
                        type="text"
                        value={formData.businessName}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                        placeholder="Business name"
                      />
                    </div>
                    <div>
                      <label htmlFor="gstNumber" className="text-sm font-medium text-emerald-700 mb-2 block">
                        GST Number
                      </label>
                      <input
                        id="gstNumber"
                        name="gstNumber"
                        type="text"
                        value={formData.gstNumber}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                        placeholder="GST number"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.role === 'farmer' && (
                <div className="pt-4 border-t-2 border-emerald-100 space-y-4">
                  <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-emerald-600" />
                    Farm Details
                  </h3>
                  <div>
                    <label htmlFor="farmName" className="text-sm font-medium text-emerald-700 mb-2 block">
                      Farm Name
                    </label>
                    <input
                      id="farmName"
                      name="farmName"
                      type="text"
                      value={formData.farmName}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                      placeholder="Your farm name"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="farmSize" className="flex items-center gap-2 text-sm font-medium text-emerald-700 mb-2">
                        <TreeDeciduous className="w-4 h-4 text-emerald-500" />
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
                        className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                        placeholder="Size"
                      />
                    </div>
                    <div>
                      <label htmlFor="farmingExperience" className="flex items-center gap-2 text-sm font-medium text-emerald-700 mb-2">
                        <Clock className="w-4 h-4 text-emerald-500" />
                        Experience (years)
                      </label>
                      <input
                        id="farmingExperience"
                        name="farmingExperience"
                        type="number"
                        min="0"
                        value={formData.farmingExperience}
                        onChange={handleChange}
                        className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                        placeholder="Years"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 border-t-2 border-emerald-100 space-y-4">
                <h3 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  Set Password
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="password" className="text-sm font-medium text-emerald-700 mb-2 block">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                      placeholder="Password"
                    />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="text-sm font-medium text-emerald-700 mb-2 block">
                      Confirm
                    </label>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      required
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full px-4 py-3 border-2 border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all bg-emerald-50/50 hover:bg-white text-emerald-900 placeholder-emerald-400"
                      placeholder="Confirm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-4 px-6 rounded-xl text-base font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-emerald-500/30 hover:shadow-2xl hover:shadow-emerald-500/40 transition-all duration-300 transform hover:scale-[1.02] disabled:hover:scale-100"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-emerald-100" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-emerald-600 font-medium">Or</span>
                </div>
              </div>

              <Link
                href="/auth/email-otp"
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 border-2 border-emerald-200 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200"
              >
                <Mail className="w-5 h-5" />
                <span>Sign up with Email OTP</span>
              </Link>

              <p className="text-xs text-emerald-600 text-center">
                By creating an account, you agree to our{' '}
                <Link href="/terms-of-service" className="text-emerald-700 hover:text-emerald-900 font-semibold">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy-policy" className="text-emerald-700 hover:text-emerald-900 font-semibold">
                  Privacy Policy
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
