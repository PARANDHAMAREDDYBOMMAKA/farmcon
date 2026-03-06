'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { profileAPI, farmerAPI } from '@/lib/api-client'
import {
  User, Phone, MapPin, Building2, FileText,
  Wheat, Droplets, Landmark, CreditCard, Save,
  CheckCircle2, AlertCircle, Loader2, Camera,
  Mail, Hash, TreeDeciduous, Clock
} from 'lucide-react'

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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-emerald-200 rounded-full animate-spin border-t-emerald-600 mx-auto"></div>
            <User className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-emerald-600" />
          </div>
          <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center bg-red-50 rounded-2xl p-8 border border-red-100">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-medium">Failed to load user profile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-700">Profile Settings</h1>
            <p className="text-gray-500 mt-1">Manage your personal and business information</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="w-16 h-16 bg-linear-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <span className="text-white text-2xl font-bold">
                  {user.fullName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-200 hover:bg-emerald-50/30 transition-colors">
                <Camera className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl animate-fadeIn">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <p className="font-medium">{error}</p>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-xl animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <p className="font-medium">{success}</p>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 bg-linear-to-r from-emerald-50 to-teal-50 border-b border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-linear-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/25">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-700">Basic Information</h2>
                <p className="text-sm text-gray-500">Your personal contact details</p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label htmlFor="full_name" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <User className="w-4 h-4 text-gray-400" />
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  required
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                  placeholder="+91 XXXXX XXXXX"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="city" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                  placeholder="Enter your city"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="state" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  required
                  value={formData.state}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                  placeholder="Enter your state"
                />
              </div>

              <div className="md:col-span-2 space-y-2">
                <label htmlFor="address" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  Address <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="address"
                  name="address"
                  required
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white resize-none"
                  placeholder="Enter your complete address"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="pincode" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Hash className="w-4 h-4 text-gray-400" />
                  PIN Code
                </label>
                <input
                  type="text"
                  id="pincode"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                  placeholder="6-digit PIN code"
                  maxLength={6}
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                  <Mail className="w-4 h-4 text-gray-400" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-slate-100 text-gray-500 cursor-not-allowed"
                />
              </div>
            </div>
          </div>
        </div>

        {user.role === 'supplier' && (
          <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 bg-linear-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-linear-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-700">Business Information</h2>
                  <p className="text-sm text-gray-500">Your company and tax details</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="business_name" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <Building2 className="w-4 h-4 text-gray-400" />
                    Business Name
                  </label>
                  <input
                    type="text"
                    id="business_name"
                    name="business_name"
                    value={formData.business_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                    placeholder="Your business or company name"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="gst_number" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                    <FileText className="w-4 h-4 text-gray-400" />
                    GST Number
                  </label>
                  <input
                    type="text"
                    id="gst_number"
                    name="gst_number"
                    value={formData.gst_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                    placeholder="GST registration number"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {user.role === 'farmer' && (
          <>
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-amber-50 to-orange-50 border-b border-amber-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/25">
                    <Wheat className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-700">Farm Information</h2>
                    <p className="text-sm text-gray-500">Details about your farming operation</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="farm_name" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Wheat className="w-4 h-4 text-gray-400" />
                      Farm Name
                    </label>
                    <input
                      type="text"
                      id="farm_name"
                      name="farm_name"
                      value={formData.farm_name}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                      placeholder="Name of your farm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="farm_location" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      Farm Location
                    </label>
                    <input
                      type="text"
                      id="farm_location"
                      name="farm_location"
                      value={formData.farm_location}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                      placeholder="Location of your farm"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="farm_size" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <TreeDeciduous className="w-4 h-4 text-gray-400" />
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
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                      placeholder="Size in acres"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="farming_experience" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Clock className="w-4 h-4 text-gray-400" />
                      Farming Experience (years)
                    </label>
                    <input
                      type="number"
                      id="farming_experience"
                      name="farming_experience"
                      min="0"
                      value={formData.farming_experience}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                      placeholder="Years of experience"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Wheat className="w-4 h-4 text-gray-400" />
                      Farming Type
                    </label>
                    <div className="flex flex-wrap gap-3">
                      {['Organic', 'Conventional', 'Mixed'].map((type) => (
                        <label
                          key={type}
                          className={`
                            relative flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 cursor-pointer
                            transition-all duration-200
                            ${formData.farming_type.includes(type)
                              ? 'border-amber-500 bg-amber-50 text-amber-700'
                              : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-50/50'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={formData.farming_type.includes(type)}
                            onChange={(e) => handleMultipleChange('farming_type', type, e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`
                            w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all
                            ${formData.farming_type.includes(type)
                              ? 'border-amber-500 bg-amber-500'
                              : 'border-gray-300'
                            }
                          `}>
                            {formData.farming_type.includes(type) && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            )}
                          </div>
                          <span className="font-medium">{type}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="soil_type" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <TreeDeciduous className="w-4 h-4 text-gray-400" />
                      Soil Type
                    </label>
                    <select
                      id="soil_type"
                      name="soil_type"
                      value={formData.soil_type}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white appearance-none cursor-pointer"
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

                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Droplets className="w-4 h-4 text-gray-400" />
                      Water Source
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {['Borewell', 'Canal', 'River', 'Rainwater', 'Tank'].map((source) => (
                        <label
                          key={source}
                          className={`
                            relative flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm
                            transition-all duration-200
                            ${formData.water_source.includes(source)
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white hover:border-blue-200'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            checked={formData.water_source.includes(source)}
                            onChange={(e) => handleMultipleChange('water_source', source, e.target.checked)}
                            className="sr-only"
                          />
                          <Droplets className={`w-3.5 h-3.5 ${formData.water_source.includes(source) ? 'text-blue-500' : 'text-gray-400'}`} />
                          <span className="font-medium">{source}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 bg-linear-to-r from-violet-50 to-purple-50 border-b border-violet-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-linear-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/25">
                    <Landmark className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-700">Banking Information</h2>
                    <p className="text-sm text-gray-500">For payments and transactions</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="bank_account" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      Bank Account Number
                    </label>
                    <input
                      type="text"
                      id="bank_account"
                      name="bank_account"
                      value={formData.bank_account}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                      placeholder="Enter account number"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="ifsc_code" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <Landmark className="w-4 h-4 text-gray-400" />
                      IFSC Code
                    </label>
                    <input
                      type="text"
                      id="ifsc_code"
                      name="ifsc_code"
                      value={formData.ifsc_code}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                      placeholder="Bank IFSC code"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="pan_number" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <FileText className="w-4 h-4 text-gray-400" />
                      PAN Number
                    </label>
                    <input
                      type="text"
                      id="pan_number"
                      name="pan_number"
                      value={formData.pan_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                      placeholder="XXXXX0000X"
                      maxLength={10}
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="aadhar_number" className="flex items-center gap-2 text-sm font-medium text-slate-600">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      Aadhar Number
                    </label>
                    <input
                      type="text"
                      id="aadhar_number"
                      name="aadhar_number"
                      value={formData.aadhar_number}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all duration-200 bg-emerald-50/30/50 hover:bg-white"
                      placeholder="12-digit Aadhar number"
                      maxLength={12}
                    />
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="
              inline-flex items-center gap-2 px-8 py-3.5
              bg-linear-to-r from-emerald-500 to-teal-500
              hover:from-emerald-600 hover:to-teal-600
              text-white font-semibold rounded-xl
              shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30
              transition-all duration-300 transform hover:scale-[1.02]
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
            "
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
