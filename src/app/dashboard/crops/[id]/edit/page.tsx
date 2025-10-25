'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import ImageUpload from '@/components/ImageUpload'
import type { Crop } from '@/types'
import { Pencil, XCircle, FileText, Calendar, Camera, DollarSign, Save, Leaf } from 'lucide-react'

export default function EditCropPage() {
  const { user, loading } = useAuth('farmer')
  const params = useParams()
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    plantedDate: '',
    expectedHarvestDate: '',
    actualHarvestDate: '',
    area: '',
    status: 'planted' as Crop['status'],
    estimatedYield: '',
    actualYield: '',
    pricePerUnit: '',
    unit: 'kg',
    description: '',
    organicCertified: false,
    images: [] as string[]
  })

  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (user && params.id) {
      loadCrop()
    }
  }, [user, params.id])

  const loadCrop = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/crops/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to load crop')
      }

      const data = await response.json()
      const crop = data.crop

      setFormData({
        name: crop.name || '',
        variety: crop.variety || '',
        plantedDate: crop.plantedDate ? new Date(crop.plantedDate).toISOString().split('T')[0] : '',
        expectedHarvestDate: crop.expectedHarvestDate ? new Date(crop.expectedHarvestDate).toISOString().split('T')[0] : '',
        actualHarvestDate: crop.actualHarvestDate ? new Date(crop.actualHarvestDate).toISOString().split('T')[0] : '',
        area: crop.area?.toString() || '',
        status: crop.status || 'planted',
        estimatedYield: crop.estimatedYield?.toString() || '',
        actualYield: crop.actualYield?.toString() || '',
        pricePerUnit: crop.pricePerUnit?.toString() || '',
        unit: crop.unit || 'kg',
        description: crop.description || '',
        organicCertified: crop.organicCertified || false,
        images: crop.images || []
      })
    } catch (error) {
      console.error('Error loading crop:', error)
      setError('Failed to load crop details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch(`/api/crops/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          area: formData.area ? parseFloat(formData.area) : null,
          estimatedYield: formData.estimatedYield ? parseFloat(formData.estimatedYield) : null,
          actualYield: formData.actualYield ? parseFloat(formData.actualYield) : null,
          pricePerUnit: formData.pricePerUnit ? parseFloat(formData.pricePerUnit) : null,
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update crop')
      }

      toast.success('Crop updated successfully!')
      router.push(`/dashboard/crops/${params.id}`)
    } catch (error: any) {
      console.error('Error updating crop:', error)
      setError(error.message || 'Failed to update crop')
    } finally {
      setIsSaving(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  if (loading || isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading crop details...</p>
        </div>
      </div>
    )
  }

  if (error && isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <XCircle className="w-24 h-24 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Error Loading Crop</h2>
          <p className="mt-2 text-gray-900">{error}</p>
          <Link
            href="/dashboard/crops"
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
          >
            Back to Crops
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {}
      <div className="mb-6">
        <nav className="flex items-center space-x-2 text-sm text-gray-900 mb-4">
          <Link href="/dashboard" className="hover:text-green-600">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/crops" className="hover:text-green-600">Crops</Link>
          <span>/</span>
          <Link href={`/dashboard/crops/${params.id}`} className="hover:text-green-600">{formData.name || 'Crop'}</Link>
          <span>/</span>
          <span className="text-gray-900">Edit</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900">✏️ Edit Crop</h1>
        <p className="text-gray-900 mt-2">Update your crop information and track its progress</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📋 Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Crop Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Rice, Wheat, Tomato"
              />
            </div>

            <div>
              <label htmlFor="variety" className="block text-sm font-medium text-gray-700 mb-2">
                Variety
              </label>
              <input
                type="text"
                id="variety"
                name="variety"
                value={formData.variety}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Basmati, Heirloom"
              />
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Current Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="planted">Planted</option>
                <option value="growing">Growing</option>
                <option value="ready_to_harvest">Ready to Harvest</option>
                <option value="harvested">Harvested</option>
                <option value="sold">Sold</option>
              </select>
            </div>

            <div>
              <label htmlFor="area" className="block text-sm font-medium text-gray-700 mb-2">
                Area (acres)
              </label>
              <input
                type="number"
                id="area"
                name="area"
                value={formData.area}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="0.5"
              />
            </div>

            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="Describe your crop, farming methods, or any special notes..."
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="organicCertified"
                name="organicCertified"
                checked={formData.organicCertified}
                onChange={handleChange}
                className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="organicCertified" className="ml-2 block text-sm text-gray-900">
                🌿 Organic Certified
              </label>
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📅 Timeline</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="plantedDate" className="block text-sm font-medium text-gray-700 mb-2">
                Planted Date
              </label>
              <input
                type="date"
                id="plantedDate"
                name="plantedDate"
                value={formData.plantedDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="expectedHarvestDate" className="block text-sm font-medium text-gray-700 mb-2">
                Expected Harvest Date
              </label>
              <input
                type="date"
                id="expectedHarvestDate"
                name="expectedHarvestDate"
                value={formData.expectedHarvestDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div>
              <label htmlFor="actualHarvestDate" className="block text-sm font-medium text-gray-700 mb-2">
                Actual Harvest Date
              </label>
              <input
                type="date"
                id="actualHarvestDate"
                name="actualHarvestDate"
                value={formData.actualHarvestDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">📷 Crop Images</h2>
          <ImageUpload
            images={formData.images}
            onImagesChange={(images) => setFormData(prev => ({ ...prev, images }))}
            maxImages={5}
          />
        </div>

        {}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">💰 Yield & Pricing</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label htmlFor="unit" className="block text-sm font-medium text-gray-700 mb-2">
                Unit *
              </label>
              <select
                id="unit"
                name="unit"
                value={formData.unit}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
              >
                <option value="kg">Kilogram (kg)</option>
                <option value="quintal">Quintal</option>
                <option value="ton">Ton</option>
                <option value="bag">Bag</option>
                <option value="piece">Piece</option>
              </select>
            </div>

            <div>
              <label htmlFor="estimatedYield" className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Yield
              </label>
              <input
                type="number"
                id="estimatedYield"
                name="estimatedYield"
                value={formData.estimatedYield}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="100"
              />
            </div>

            <div>
              <label htmlFor="actualYield" className="block text-sm font-medium text-gray-700 mb-2">
                Actual Yield
              </label>
              <input
                type="number"
                id="actualYield"
                name="actualYield"
                value={formData.actualYield}
                onChange={handleChange}
                step="0.1"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="95"
              />
            </div>

            <div>
              <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700 mb-2">
                Price per {formData.unit} (₹)
              </label>
              <input
                type="number"
                id="pricePerUnit"
                name="pricePerUnit"
                value={formData.pricePerUnit}
                onChange={handleChange}
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-green-500 focus:border-green-500"
                placeholder="25.00"
              />
            </div>
          </div>

          {}
          {formData.estimatedYield && formData.pricePerUnit && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg">
              <h3 className="text-sm font-medium text-green-800 mb-2">💡 Estimated Revenue</h3>
              <p className="text-lg font-bold text-green-600">
                ₹{(parseFloat(formData.estimatedYield) * parseFloat(formData.pricePerUnit)).toLocaleString()}
              </p>
              <p className="text-sm text-green-700">
                {formData.estimatedYield} {formData.unit} × ₹{formData.pricePerUnit} per {formData.unit}
              </p>
            </div>
          )}
        </div>

        {}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Link
            href={`/dashboard/crops/${params.id}`}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-center"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Updating...
              </>
            ) : (
              '💾 Update Crop'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}