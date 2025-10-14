'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import type { CropWithDetails } from '@/types'
import { Leaf, Pencil, Trash2, FileText, Calendar, DollarSign, Store, CheckCircle, XCircle } from 'lucide-react'

export default function CropDetailPage() {
  const { user, loading } = useAuth('farmer')
  const params = useParams()
  const router = useRouter()
  const [crop, setCrop] = useState<CropWithDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
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
      setCrop(data.crop)
    } catch (error) {
      console.error('Error loading crop:', error)
      setError('Failed to load crop details')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this crop? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/crops/${params.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete crop')
      }

      toast.success('Crop deleted successfully!')
      router.push('/dashboard/crops')
    } catch (error) {
      console.error('Error deleting crop:', error)
      toast.error('Failed to delete crop')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planted':
        return 'text-blue-600 bg-blue-100'
      case 'growing':
        return 'text-green-600 bg-green-100'
      case 'ready_to_harvest':
        return 'text-yellow-600 bg-yellow-100'
      case 'harvested':
        return 'text-purple-600 bg-purple-100'
      case 'sold':
        return 'text-gray-600 bg-gray-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getDaysFromPlanting = (plantedDate?: string) => {
    if (!plantedDate) return null
    const planted = new Date(plantedDate)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - planted.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const getDaysToHarvest = (harvestDate?: string) => {
    if (!harvestDate) return null
    const harvest = new Date(harvestDate)
    const today = new Date()
    const diffTime = harvest.getTime() - today.getTime()
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }

  if (loading || isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading crop details...</p>
        </div>
      </div>
    )
  }

  if (error || !crop) {
    return (
      <div className="p-6">
        <div className="text-center">
          <XCircle className="w-24 h-24 text-red-500 mx-auto" />
          <h2 className="mt-4 text-xl font-semibold text-gray-900">Crop not found</h2>
          <p className="mt-2 text-gray-600">{error || 'The crop you are looking for does not exist.'}</p>
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
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <Link href="/dashboard" className="hover:text-green-600">Dashboard</Link>
          <span>/</span>
          <Link href="/dashboard/crops" className="hover:text-green-600">Crops</Link>
          <span>/</span>
          <span className="text-gray-900">{crop.name}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-gray-900">{crop.name}</h1>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(crop.status)}`}>
              {crop.status.replace('_', ' ').charAt(0).toUpperCase() + crop.status.replace('_', ' ').slice(1)}
            </span>
            {crop.organicCertified && (
              <span className="inline-flex items-center gap-1 px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                <Leaf className="w-4 h-4" />
                Organic
              </span>
            )}
          </div>

          <div className="mt-4 sm:mt-0 flex space-x-3">
            <Link
              href={`/dashboard/crops/${crop.id}/edit`}
              className="inline-flex items-center gap-2 px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <Pencil className="w-4 h-4" />
              Edit Crop
            </Link>
            <button
              onClick={handleDelete}
              className="inline-flex items-center gap-2 px-4 py-2 border border-red-300 rounded-md shadow-sm text-sm font-medium text-red-700 bg-white hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      {}
      {crop.images && crop.images.length > 0 && (
        <div className="mb-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {crop.images.map((image, index) => (
              <div key={index} className="aspect-w-4 aspect-h-3 rounded-lg overflow-hidden">
                <img
                  src={image}
                  alt={`${crop.name} - Image ${index + 1}`}
                  className="w-full h-64 object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {}
        <div className="lg:col-span-2 space-y-6">
          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <FileText className="w-6 h-6 text-green-600" />
              Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Crop Name</label>
                <p className="text-gray-900 font-semibold">{crop.name}</p>
              </div>
              {crop.variety && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Variety</label>
                  <p className="text-gray-900">{crop.variety}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <p className="text-gray-900">{crop.status.replace('_', ' ').charAt(0).toUpperCase() + crop.status.replace('_', ' ').slice(1)}</p>
              </div>
              {crop.area && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Area</label>
                  <p className="text-gray-900 font-semibold">{crop.area} acres</p>
                </div>
              )}
            </div>

            {crop.description && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <p className="text-gray-900 mt-1">{crop.description}</p>
              </div>
            )}
          </div>

          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="w-6 h-6 text-green-600" />
              Timeline
            </h2>
            <div className="space-y-4">
              {crop.plantedDate && (
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Planted Date</p>
                    <p className="text-sm text-gray-600">{new Date(crop.plantedDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Days since planting</p>
                    <p className="font-bold text-blue-600">{getDaysFromPlanting(crop.plantedDate)} days</p>
                  </div>
                </div>
              )}

              {crop.expectedHarvestDate && (
                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Expected Harvest</p>
                    <p className="text-sm text-gray-600">{new Date(crop.expectedHarvestDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Days to harvest</p>
                    <p className="font-bold text-yellow-600">{getDaysToHarvest(crop.expectedHarvestDate)} days</p>
                  </div>
                </div>
              )}

              {crop.actualHarvestDate && (
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">Actual Harvest</p>
                    <p className="text-sm text-gray-600">{new Date(crop.actualHarvestDate).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right flex items-center gap-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-sm text-gray-600">Harvested</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-600" />
              Yield & Pricing
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Estimated Yield</h3>
                {crop.estimatedYield ? (
                  <p className="text-2xl font-bold text-green-600">{crop.estimatedYield} {crop.unit}</p>
                ) : (
                  <p className="text-gray-500">Not specified</p>
                )}
              </div>

              {crop.actualYield && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Actual Yield</h3>
                  <p className="text-2xl font-bold text-purple-600">{crop.actualYield} {crop.unit}</p>
                </div>
              )}

              {crop.pricePerUnit && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Price Per Unit</h3>
                  <p className="text-2xl font-bold text-blue-600">₹{crop.pricePerUnit}/{crop.unit}</p>
                </div>
              )}

              {crop.estimatedYield && crop.pricePerUnit && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Estimated Revenue</h3>
                  <p className="text-2xl font-bold text-green-600">₹{(Number(crop.estimatedYield) * Number(crop.pricePerUnit)).toLocaleString()}</p>
                </div>
              )}
            </div>
          </div>

          {}
          {crop.listings && crop.listings.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Store className="w-6 h-6 text-green-600" />
                Active Listings
              </h2>
              <div className="space-y-4">
                {crop.listings.map((listing) => (
                  <div key={listing.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{listing.quantityAvailable} {listing.unit} available</p>
                        <p className="text-gray-600">₹{listing.pricePerUnit}/{listing.unit}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {}
        <div className="space-y-6">
          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">📊 Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Created</span>
                <span className="font-medium">{new Date(crop.createdAt).toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Updated</span>
                <span className="font-medium">{new Date(crop.updatedAt).toLocaleDateString()}</span>
              </div>
              {crop.organicCertified && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Certification</span>
                  <span className="font-medium text-green-600 flex items-center gap-1">
                    <Leaf className="w-4 h-4" />
                    Organic
                  </span>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-3">
              {crop.status === 'harvested' && (
                <Link
                  href={`/dashboard/sell?crop=${crop.id}`}
                  className="flex items-center justify-center gap-2 w-full text-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  <Store className="w-4 h-4" />
                  List for Sale
                </Link>
              )}

              <Link
                href={`/dashboard/crops/${crop.id}/edit`}
                className="flex items-center justify-center gap-2 w-full text-center px-4 py-2 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50"
              >
                <Pencil className="w-4 h-4" />
                Edit Details
              </Link>

              <Link
                href="/dashboard/crops"
                className="block w-full text-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                ← Back to Crops
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}