'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { profileAPI } from '@/lib/api-client'
import ImageUpload from '@/components/ImageUpload'
import type { User } from '@/types'

export default function AddCropPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    planted_date: '',
    expected_harvest_date: '',
    area: '',
    estimated_yield: '',
    unit: 'kg',
    description: '',
    organic_certified: false
  })
  const [images, setImages] = useState<string[]>([])

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/signin')
        return
      }

      const profile = await profileAPI.getProfile(session.user.id)
      
      if (!profile || profile.role !== 'farmer') {
        router.push('/dashboard')
        return
      }

      setUser(profile)
    } catch (error) {
      console.error('Error checking auth:', error)
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setFormData(prev => ({
        ...prev,
        [name]: target.checked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setError('')

    try {
      
      if (!formData.name || !formData.planted_date) {
        setError('Please fill in all required fields')
        return
      }

      const cropData = {
        farmerId: user.id,
        name: formData.name,
        variety: formData.variety || null,
        plantedDate: formData.planted_date,
        expectedHarvestDate: formData.expected_harvest_date || null,
        area: formData.area ? parseFloat(formData.area) : null,
        estimatedYield: formData.estimated_yield ? parseFloat(formData.estimated_yield) : null,
        unit: formData.unit,
        description: formData.description || null,
        organicCertified: formData.organic_certified,
        status: 'planted',
        images: images
      }

      const response = await fetch('/api/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cropData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add crop')
      }

      router.push('/dashboard/crops?success=added')

    } catch (err: any) {
      console.error('Error adding crop:', err)
      setError(err.message || 'Failed to add crop')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Add New Crop</h1>
          <p className="text-gray-900">Record a new crop in your farm management system</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Crop Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Tomatoes, Rice, Wheat"
              />
            </div>

            <div>
              <label htmlFor="variety" className="block text-sm font-medium text-gray-700">
                Variety
              </label>
              <input
                type="text"
                id="variety"
                name="variety"
                value={formData.variety}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Cherry, Basmati"
              />
            </div>

            <div>
              <label htmlFor="planted_date" className="block text-sm font-medium text-gray-700">
                Planted Date *
              </label>
              <input
                type="date"
                id="planted_date"
                name="planted_date"
                required
                value={formData.planted_date}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="expected_harvest_date" className="block text-sm font-medium text-gray-700">
                Expected Harvest Date
              </label>
              <input
                type="date"
                id="expected_harvest_date"
                name="expected_harvest_date"
                value={formData.expected_harvest_date}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700">
                Area (acres)
              </label>
              <input
                type="number"
                id="area"
                name="area"
                min="0"
                step="0.1"
                value={formData.area}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="0.5"
              />
            </div>

            <div>
              <label htmlFor="estimated_yield" className="block text-sm font-medium text-gray-700">
                Estimated Yield
              </label>
              <input
                type="number"
                id="estimated_yield"
                name="estimated_yield"
                min="0"
                step="0.1"
                value={formData.estimated_yield}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="100"
              />
            </div>

            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
                Unit
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="kg">Kilograms (kg)</option>
                <option value="quintal">Quintal</option>
                <option value="ton">Ton</option>
                <option value="piece">Pieces</option>
                <option value="bundle">Bundles</option>
              </select>
            </div>

            <div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="organic_certified"
                  name="organic_certified"
                  checked={formData.organic_certified}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="organic_certified" className="ml-2 block text-sm text-gray-700">
                  Organic Certified
                </label>
              </div>
            </div>
          </div>

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
              placeholder="Additional details about this crop..."
            />
          </div>

          {}
          <ImageUpload
            images={images}
            onImagesChange={setImages}
            maxImages={5}
            className="col-span-full"
          />

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
              disabled={saving}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {saving ? 'Adding Crop...' : 'Add Crop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}