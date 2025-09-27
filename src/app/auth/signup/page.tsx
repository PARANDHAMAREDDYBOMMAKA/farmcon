'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { profileAPI, farmerAPI } from '@/lib/api-client'
import type { UserRole } from '@/types'

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
    // Business fields for suppliers
    businessName: '',
    gstNumber: '',
    // Farmer-specific fields
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
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleMultipleChange = (name: string, value: string, checked: boolean) => {
    const currentArray = formData[name as keyof typeof formData] as string[]
    if (checked) {
      setFormData({
        ...formData,
        [name]: [...currentArray, value]
      })
    } else {
      setFormData({
        ...formData,
        [name]: currentArray.filter(item => item !== value)
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      } else if (data.user) {
        // Create profile in database using API
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

          // If user is a farmer and has farm data, create farmer profile
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

          // Store additional data in user metadata for fallback
          const { error: updateError } = await supabase.auth.updateUser({
            data: {
              full_name: formData.fullName,
              phone: formData.phone,
              role: formData.role,
              city: formData.city,
              state: formData.state
            }
          })

          if (updateError) {
            console.error('User metadata update error:', updateError)
          }

          // Profile created successfully during signup, redirect based on role
          if (formData.role === 'farmer') {
            router.push('/dashboard?welcome=true')
          } else if (formData.role === 'consumer') {
            router.push('/dashboard?welcome=true')
          } else if (formData.role === 'supplier') {
            router.push('/dashboard?welcome=true')
          } else if (formData.role === 'admin') {
            router.push('/dashboard?welcome=true')
          } else {
            router.push('/dashboard?welcome=true')
          }

        } catch (profileError: any) {
          console.error('Profile creation error:', profileError)
          setError(`Failed to create profile: ${profileError.message || 'Unknown error'}`)
        }
      }
    } catch (err) {
      console.error('Signup error:', err)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-400 to-green-600 relative">
        <div className="flex flex-col justify-center px-12 text-white">
          <h2 className="text-4xl font-bold mb-6">Join the Digital Farming Revolution</h2>
          <p className="text-xl mb-8 opacity-90">
            Connect with thousands of farmers across India. Manage your crops, track prices, and grow your business.
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Real-time market prices</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Smart crop management</span>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-white rounded-full mr-3"></div>
              <span>Direct sales platform</span>
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
              Create your account
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/signin" className="font-medium text-green-600 hover:text-green-500">
                Sign in
              </Link>
            </p>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                  I am a *
                </label>
                <select
                  id="role"
                  name="role"
                  required
                  value={formData.role}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="consumer">Consumer (Buy crops and products)</option>
                  <option value="farmer">Farmer (Sell crops and buy supplies)</option>
                  <option value="supplier">Supplier (Sell agricultural supplies)</option>
                </select>
              </div>

              {/* Basic Information */}
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address *
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter your email"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="+91 9876543210"
                />
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <input
                    id="city"
                    name="city"
                    type="text"
                    required
                    value={formData.city}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="City"
                  />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State *
                  </label>
                  <input
                    id="state"
                    name="state"
                    type="text"
                    required
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="State"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address *
                  </label>
                  <input
                    id="address"
                    name="address"
                    type="text"
                    required
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Full address"
                  />
                </div>
                <div>
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                    Pincode *
                  </label>
                  <input
                    id="pincode"
                    name="pincode"
                    type="text"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="000000"
                  />
                </div>
              </div>

              {/* Supplier-specific fields */}
              {formData.role === 'supplier' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
                  </div>
                  
                  <div>
                    <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                      Business Name
                    </label>
                    <input
                      id="businessName"
                      name="businessName"
                      type="text"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Your business name"
                    />
                  </div>

                  <div>
                    <label htmlFor="gstNumber" className="block text-sm font-medium text-gray-700">
                      GST Number (Optional)
                    </label>
                    <input
                      id="gstNumber"
                      name="gstNumber"
                      type="text"
                      value={formData.gstNumber}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="GST registration number"
                    />
                  </div>
                </>
              )}

              {/* Farmer-specific fields */}
              {formData.role === 'farmer' && (
                <>
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Farm Details</h3>
                  </div>
                  
                  <div>
                    <label htmlFor="farmName" className="block text-sm font-medium text-gray-700">
                      Farm Name
                    </label>
                    <input
                      id="farmName"
                      name="farmName"
                      type="text"
                      value={formData.farmName}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Your farm name"
                    />
                  </div>

                  <div>
                    <label htmlFor="farmLocation" className="block text-sm font-medium text-gray-700">
                      Farm Location
                    </label>
                    <input
                      id="farmLocation"
                      name="farmLocation"
                      type="text"
                      value={formData.farmLocation}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Village, District"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="farmSize" className="block text-sm font-medium text-gray-700">
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
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Farm size"
                      />
                    </div>
                    <div>
                      <label htmlFor="farmingExperience" className="block text-sm font-medium text-gray-700">
                        Experience (years)
                      </label>
                      <input
                        id="farmingExperience"
                        name="farmingExperience"
                        type="number"
                        min="0"
                        value={formData.farmingExperience}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder="Years of experience"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Farming Type
                    </label>
                    <div className="flex flex-wrap gap-4">
                      {['Organic', 'Conventional', 'Mixed'].map((type) => (
                        <label key={type} className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.farmingType.includes(type)}
                            onChange={(e) => handleMultipleChange('farmingType', type, e.target.checked)}
                            className="form-checkbox h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Password fields */}
              <div className="border-t pt-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Create a password"
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Confirm your password"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}