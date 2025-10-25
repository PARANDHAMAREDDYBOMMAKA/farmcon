'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { equipmentAPI } from '@/lib/api-client'

export default function AddEquipmentPage() {
  const { user, loading: authLoading } = useAuth()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    category: 'Tractor',
    brand: '',
    model: '',
    year_manufactured: '',
    description: '',
    hourly_rate: '',
    daily_rate: '',
    status: 'available' as const,
    location: '',
    specifications: {
      power: '',
      fuel_type: '',
      condition: 'good',
      capacity: '',
      maintenance_date: ''
    }
  })

  const categories = [
    'Tractor',
    'Harvester', 
    'Plough',
    'Seeder',
    'Sprayer',
    'Thresher',
    'Cultivator',
    'Irrigation Equipment',
    'Storage Equipment',
    'Processing Equipment',
    'Other'
  ]

  const fuelTypes = [
    'Diesel',
    'Petrol',
    'Electric',
    'Manual',
    'CNG',
    'Other'
  ]

  const conditionOptions = [
    'excellent',
    'good', 
    'fair',
    'needs_repair'
  ]

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/signin')
        return
      }

      if (user.role !== 'farmer') {
        router.push('/dashboard')
        return
      }

      if (user.city && user.state) {
        setFormData(prev => ({
          ...prev,
          location: `${user.city}, ${user.state}`
        }))
      }
    }
  }, [user, authLoading, router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSpecificationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      specifications: {
        ...prev.specifications,
        [name]: value
      }
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError('')

    const loadingToast = toast.loading('Adding equipment...')

    try {
      
      if (!formData.name || !formData.category) {
        const errorMsg = 'Please fill in all required fields'
        setError(errorMsg)
        toast.error(errorMsg, { id: loadingToast })
        return
      }

      const cleanSpecs: Record<string, any> = {}
      Object.entries(formData.specifications).forEach(([key, value]) => {
        if (value && value.toString().trim()) {
          cleanSpecs[key] = value
        }
      })

      const equipmentData = {
        owner_id: user.id,
        name: formData.name,
        category: formData.category,
        brand: formData.brand || null,
        model: formData.model || null,
        year_manufactured: formData.year_manufactured ? parseInt(formData.year_manufactured) : null,
        description: formData.description || null,
        images: [], 
        hourly_rate: formData.hourly_rate ? parseFloat(formData.hourly_rate) : null,
        daily_rate: formData.daily_rate ? parseFloat(formData.daily_rate) : null,
        status: formData.status,
        location: formData.location || null,
        specifications: Object.keys(cleanSpecs).length > 0 ? cleanSpecs : null
      }

      const result = await equipmentAPI.createEquipment(equipmentData)

      if (!result) {
        throw new Error('Failed to create equipment listing')
      }

      toast.success('Equipment listed successfully!', { id: loadingToast })

      router.push('/dashboard/equipment?success=added')

    } catch (err: any) {
      console.error('Error adding equipment:', err)
      const errorMsg = err.message || 'Failed to add equipment'
      setError(errorMsg)
      toast.error(errorMsg, { id: loadingToast })
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">List Your Equipment</h1>
          <p className="text-gray-900">Share your farming equipment with other farmers in your area</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          {}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Equipment Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., John Deere 5050D"
                />
              </div>

              <div>
                <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  required
                  value={formData.category}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="brand" className="block text-sm font-medium text-gray-700">
                  Brand
                </label>
                <input
                  type="text"
                  id="brand"
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., John Deere, Mahindra"
                />
              </div>

              <div>
                <label htmlFor="model" className="block text-sm font-medium text-gray-700">
                  Model
                </label>
                <input
                  type="text"
                  id="model"
                  name="model"
                  value={formData.model}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 5050D, 575 DI"
                />
              </div>

              <div>
                <label htmlFor="year_manufactured" className="block text-sm font-medium text-gray-700">
                  Year Manufactured
                </label>
                <input
                  type="number"
                  id="year_manufactured"
                  name="year_manufactured"
                  min="1980"
                  max={new Date().getFullYear()}
                  value={formData.year_manufactured}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="2020"
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                  Availability Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="available">Available</option>
                  <option value="rented">Currently Rented</option>
                  <option value="maintenance">Under Maintenance</option>
                  <option value="unavailable">Unavailable</option>
                </select>
              </div>
            </div>
          </div>

          {}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rental Pricing</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="hourly_rate" className="block text-sm font-medium text-gray-700">
                  Hourly Rate (₹)
                </label>
                <input
                  type="number"
                  id="hourly_rate"
                  name="hourly_rate"
                  min="0"
                  step="0.01"
                  value={formData.hourly_rate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="500.00"
                />
                <p className="mt-1 text-sm text-gray-900">Leave empty if not available for hourly rental</p>
              </div>

              <div>
                <label htmlFor="daily_rate" className="block text-sm font-medium text-gray-700">
                  Daily Rate (₹)
                </label>
                <input
                  type="number"
                  id="daily_rate"
                  name="daily_rate"
                  min="0"
                  step="0.01"
                  value={formData.daily_rate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="2000.00"
                />
                <p className="mt-1 text-sm text-gray-900">Leave empty if not available for daily rental</p>
              </div>
            </div>
            {!formData.hourly_rate && !formData.daily_rate && (
              <p className="mt-2 text-sm text-yellow-600">Please specify at least one rental rate (hourly or daily)</p>
            )}
          </div>

          {}
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="City, State or specific address"
            />
          </div>

          {}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Technical Specifications</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="power" className="block text-sm font-medium text-gray-700">
                  Power (HP)
                </label>
                <input
                  type="text"
                  id="power"
                  name="power"
                  value={formData.specifications.power}
                  onChange={handleSpecificationChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="50 HP"
                />
              </div>

              <div>
                <label htmlFor="fuel_type" className="block text-sm font-medium text-gray-700">
                  Fuel Type
                </label>
                <select
                  id="fuel_type"
                  name="fuel_type"
                  value={formData.specifications.fuel_type}
                  onChange={handleSpecificationChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select fuel type</option>
                  {fuelTypes.map((fuel) => (
                    <option key={fuel} value={fuel}>
                      {fuel}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="condition" className="block text-sm font-medium text-gray-700">
                  Condition
                </label>
                <select
                  id="condition"
                  name="condition"
                  value={formData.specifications.condition}
                  onChange={handleSpecificationChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                >
                  {conditionOptions.map((condition) => (
                    <option key={condition} value={condition}>
                      {condition.charAt(0).toUpperCase() + condition.slice(1).replace('_', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                  Capacity/Size
                </label>
                <input
                  type="text"
                  id="capacity"
                  name="capacity"
                  value={formData.specifications.capacity}
                  onChange={handleSpecificationChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., 1000L, 5 acres/hour"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="maintenance_date" className="block text-sm font-medium text-gray-700">
                  Last Maintenance Date
                </label>
                <input
                  type="date"
                  id="maintenance_date"
                  name="maintenance_date"
                  value={formData.specifications.maintenance_date}
                  onChange={handleSpecificationChange}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>
          </div>

          {}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={4}
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              placeholder="Describe your equipment, its condition, any special features, rental terms, etc."
            />
          </div>

          {}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || (!formData.hourly_rate && !formData.daily_rate)}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {saving ? 'Listing Equipment...' : 'List Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}