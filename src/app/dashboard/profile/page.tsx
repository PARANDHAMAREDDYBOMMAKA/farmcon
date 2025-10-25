'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { profileAPI, farmerAPI } from '@/lib/api-client'
import type { FarmerProfile } from '@/lib/prisma'

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    business_name: '',
    gst_number: '',
    
    farm_name: '',
    farm_location: '',
    farm_size: '',
    farming_experience: '',
    farming_type: [] as string[],
    soil_type: '',
    water_source: [] as string[],
    bank_account: '',
    ifsc_code: '',
    pan_number: '',
    aadhar_number: ''
  })

  useEffect(() => {
    if (user && !authLoading) {
      loadProfile()
    }
  }, [user, authLoading])

  const loadProfile = async () => {
    if (!user) return
    
    try {
      
      setFormData({
        full_name: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        pincode: user.pincode || '',
        business_name: user.businessName || '',
        gst_number: user.gstNumber || '',
        
        farm_name: '',
        farm_location: '',
        farm_size: '',
        farming_experience: '',
        farming_type: [],
        soil_type: '',
        water_source: [],
        bank_account: '',
        ifsc_code: '',
        pan_number: '',
        aadhar_number: ''
      })

      if (user.role === 'farmer') {
        try {
          const farmerData = await farmerAPI.getFarmerProfile(user.id)
          if (farmerData) {
            setFormData(prev => ({
              ...prev,
              farm_name: farmerData.farmName || '',
              farm_location: farmerData.farmLocation || '',
              farm_size: farmerData.farmSize?.toString() || '',
              farming_experience: farmerData.farmingExperience?.toString() || '',
              farming_type: farmerData.farmingType || [],
              soil_type: farmerData.soilType || '',
              water_source: farmerData.waterSource || [],
              bank_account: farmerData.bankAccount || '',
              ifsc_code: farmerData.ifscCode || '',
              pan_number: farmerData.panNumber || '',
              aadhar_number: farmerData.aadharNumber || ''
            }))
          }
        } catch (farmerErr) {
          console.log('No farmer profile found, will create on save')
        }
      }
    } catch (err) {
      console.error('Error loading profile:', err)
      setError('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      if (!user) return

      await profileAPI.updateProfile(user.id, {
        fullName: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        businessName: formData.business_name,
        gstNumber: formData.gst_number
      })

      if (user.role === 'farmer') {
        await farmerAPI.upsertFarmerProfile({
          id: user.id,
          farmName: formData.farm_name,
          farmLocation: formData.farm_location,
          farmSize: formData.farm_size ? parseFloat(formData.farm_size) : undefined,
          farmingExperience: formData.farming_experience ? parseInt(formData.farming_experience) : undefined,
          farmingType: formData.farming_type.length > 0 ? formData.farming_type : undefined,
          soilType: formData.soil_type,
          waterSource: formData.water_source.length > 0 ? formData.water_source : undefined,
          bankAccount: formData.bank_account,
          ifscCode: formData.ifsc_code,
          panNumber: formData.pan_number,
          aadharNumber: formData.aadhar_number
        })
      }

      setSuccess('Profile updated successfully!')

      await loadProfile()
      
    } catch (err: any) {
      console.error('Save error:', err)
      setError(err.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-red-600">Failed to load user profile</p>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-900">Update your personal and business information</p>
        </div>

        <form onSubmit={handleSave} className="space-y-8">
          {}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
              {success}
            </div>
          )}

          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address *
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                  PIN Code
                </label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {}
          {user.role === 'supplier' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="business_name" className="block text-sm font-medium text-gray-700">
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="business_name"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="Your business or company name"
                  />
                </div>

                <div>
                  <label htmlFor="gst_number" className="block text-sm font-medium text-gray-700">
                    GST Number
                  </label>
                  <input
                    type="text"
                    id="gst_number"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="GST registration number"
                  />
                </div>
              </div>
            </div>
          )}

          {}
          {user.role === 'farmer' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Farm Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="farm_name" className="block text-sm font-medium text-gray-700">
                    Farm Name
                  </label>
                  <input
                    type="text"
                    id="farm_name"
                    name="farm_name"
                    value={formData.farm_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="farm_location" className="block text-sm font-medium text-gray-700">
                    Farm Location
                  </label>
                  <input
                    type="text"
                    id="farm_location"
                    name="farm_location"
                    value={formData.farm_location}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="farm_size" className="block text-sm font-medium text-gray-700">
                    Farm Size (acres)
                  </label>
                  <input
                    type="number"
                    id="farm_size"
                    name="farm_size"
                    min="0"
                    step="0.1"
                    value={formData.farm_size}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div>
                  <label htmlFor="farming_experience" className="block text-sm font-medium text-gray-700">
                    Farming Experience (years)
                  </label>
                  <input
                    type="number"
                    id="farming_experience"
                    name="farming_experience"
                    min="0"
                    value={formData.farming_experience}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Farming Type
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {['Organic', 'Conventional', 'Mixed'].map((type) => (
                      <label key={type} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.farming_type.includes(type)}
                          onChange={(e) => handleMultipleChange('farming_type', type, e.target.checked)}
                          className="form-checkbox h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label htmlFor="soil_type" className="block text-sm font-medium text-gray-700">
                    Soil Type
                  </label>
                  <select
                    id="soil_type"
                    name="soil_type"
                    value={formData.soil_type}
                    onChange={handleInputChange}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select soil type</option>
                    <option value="Clay">Clay</option>
                    <option value="Sandy">Sandy</option>
                    <option value="Loamy">Loamy</option>
                    <option value="Silt">Silt</option>
                    <option value="Peaty">Peaty</option>
                    <option value="Chalky">Chalky</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Water Source
                  </label>
                  <div className="flex flex-wrap gap-4">
                    {['Borewell', 'Canal', 'River', 'Rainwater', 'Tank'].map((source) => (
                      <label key={source} className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.water_source.includes(source)}
                          onChange={(e) => handleMultipleChange('water_source', source, e.target.checked)}
                          className="form-checkbox h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{source}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {}
              <div className="mt-8">
                <h3 className="text-md font-semibold text-gray-900 mb-4">Banking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="bank_account" className="block text-sm font-medium text-gray-700">
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      id="bank_account"
                      name="bank_account"
                      value={formData.bank_account}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="ifsc_code" className="block text-sm font-medium text-gray-700">
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      id="ifsc_code"
                      name="ifsc_code"
                      value={formData.ifsc_code}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="pan_number" className="block text-sm font-medium text-gray-700">
                      PAN Number
                    </label>
                    <input
                      type="text"
                      id="pan_number"
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>

                  <div>
                    <label htmlFor="aadhar_number" className="block text-sm font-medium text-gray-700">
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      id="aadhar_number"
                      name="aadhar_number"
                      value={formData.aadhar_number}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}