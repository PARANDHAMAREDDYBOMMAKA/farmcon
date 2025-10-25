'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { cropsAPI } from '@/lib/api-client'
import type { Crop } from '@/types'
import { Wheat, Sprout, Leaf, CheckCircle, DollarSign, Globe, Eye, Pencil, RefreshCw, Sparkles, Store } from 'lucide-react'

export default function CropsManagementPage() {
  const { user, loading } = useAuth('farmer')
  const [crops, setCrops] = useState<Crop[]>([])
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    if (user) {
      loadCrops()
    }
  }, [user])

  const loadCrops = async () => {
    try {
      if (!user) return
      const cropsData = await cropsAPI.getCrops(user.id)
      setCrops(cropsData || [])
    } catch (error) {
      console.error('Error loading crops:', error)
    }
  }

  const updateCropStatus = async (cropId: string, newStatus: Crop['status']) => {
    try {
      const response = await fetch(`/api/crops/${cropId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update crop status')
      }

      const { crop } = await response.json()

      setCrops(crops => 
        crops.map(c => 
          c.id === cropId ? { ...c, status: crop.status, actualHarvestDate: crop.actualHarvestDate } : c
        )
      )

      toast.success(`Crop status updated to ${newStatus.replace('_', ' ')}!`)

    } catch (error: any) {
      console.error('Error updating crop status:', error)
      toast.error(`Failed to update crop status: ${error.message}`)
    }
  }

  const getStatusColor = (status: Crop['status']) => {
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
        return 'text-gray-900 bg-gray-100'
      default:
        return 'text-gray-900 bg-gray-100'
    }
  }

  const filteredCrops = filter === 'all' 
    ? crops 
    : crops.filter(crop => crop.status === filter)

  const getDaysFromPlanting = (plantedDate?: string) => {
    if (!plantedDate) return null
    const planted = new Date(plantedDate)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - planted.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto"></div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900">Loading your crops...</h3>
            <p className="text-gray-900 mt-2">Please wait while we fetch your crop data</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      <div className="p-6">
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-2">
                <Wheat className="w-8 h-8 text-green-600" />
                My Crops
              </h1>
              <p className="text-gray-900 mt-2 text-lg">Manage your crop lifecycle from planting to harvest</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => loadCrops()}
                className="inline-flex items-center gap-2 px-4 py-2 border border-green-600 text-green-600 rounded-lg shadow-sm text-sm font-medium hover:bg-green-50 transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <Link
                href="/dashboard/crops/add"
                className="inline-flex items-center gap-2 px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
              >
                <Sparkles className="w-4 h-4" />
                Add New Crop
              </Link>
            </div>
          </div>
        </div>

      {}
      <div className="mb-8">
        <div className="bg-white rounded-2xl shadow-lg p-2 max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All', icon: Globe },
              { key: 'planted', label: 'Planted', icon: Sprout },
              { key: 'growing', label: 'Growing', icon: Leaf },
              { key: 'ready_to_harvest', label: 'Ready', icon: Wheat },
              { key: 'harvested', label: 'Harvested', icon: CheckCircle },
              { key: 'sold', label: 'Sold', icon: DollarSign }
            ].map((item) => {
              const Icon = item.icon
              return (
                <button
                  key={item.key}
                  onClick={() => setFilter(item.key)}
                  className={`flex-1 min-w-fit px-4 py-3 rounded-xl font-semibold text-sm transition-all duration-300 transform hover:scale-105 ${
                    filter === item.key
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                      : 'text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Icon className="w-5 h-5" />
                    <span className="hidden sm:inline">{item.label}</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      filter === item.key
                        ? 'bg-white text-green-600'
                        : 'bg-gray-200 text-gray-900'
                    }`}>
                      {item.key === 'all' ? crops.length : crops.filter(c => c.status === item.key).length}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {filteredCrops.length === 0 ? (
        <div className="text-center py-20">
          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-md mx-auto">
            <Sprout className="w-24 h-24 text-green-500 mx-auto" />
            <h3 className="mt-6 text-2xl font-bold text-gray-900">
              {filter === 'all' ? 'No crops yet' : `No ${filter.replace('_', ' ')} crops`}
            </h3>
            <p className="mt-4 text-gray-900 text-lg">
              {filter === 'all'
                ? 'Start your farming journey by adding your first crop!'
                : `No crops in ${filter.replace('_', ' ')} status.`
              }
            </p>
            {filter === 'all' && (
              <Link
                href="/dashboard/crops/add"
                className="mt-8 inline-flex items-center gap-2 px-8 py-4 border border-transparent rounded-2xl shadow-lg text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transition-all duration-300 transform hover:scale-105"
              >
                <Wheat className="w-6 h-6" />
                Add Your First Crop
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCrops.map((crop) => (
            <div key={crop.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden border border-gray-100">
              <div className="relative w-full h-48 bg-gradient-to-br from-green-100 to-emerald-200">
                {crop.images && crop.images.length > 0 ? (
                  <img
                    src={crop.images[0]}
                    alt={crop.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Wheat className="w-16 h-16 text-green-600" />
                  </div>
                )}
                <div className="absolute top-3 right-3 flex gap-2">
                  <span className={`inline-flex px-2 py-1 text-xs font-bold rounded-full ${getStatusColor(crop.status)} shadow-sm`}>
                    {crop.status.replace('_', ' ').charAt(0).toUpperCase() + crop.status.replace('_', ' ').slice(1)}
                  </span>
                  {crop.organicCertified && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-bold rounded-full bg-green-500 text-white shadow-sm">
                      <Leaf className="w-3 h-3" />
                      Organic
                    </span>
                  )}
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">{crop.name}</h3>
                  {crop.variety && (
                    <p className="text-sm text-gray-900 font-medium">{crop.variety}</p>
                  )}
                </div>

                <div className="mt-3 space-y-2 text-sm text-gray-900">
                  {crop.area && (
                    <div className="flex justify-between">
                      <span>Area:</span>
                      <span className="font-medium">{crop.area?.toString()} acres</span>
                    </div>
                  )}
                  
                  {crop.plantedDate && (
                    <div className="flex justify-between">
                      <span>Planted:</span>
                      <span className="font-medium">{new Date(crop.plantedDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {crop.plantedDate && (
                    <div className="flex justify-between">
                      <span>Days:</span>
                      <span className="font-medium">{getDaysFromPlanting(crop.plantedDate?.toString())} days</span>
                    </div>
                  )}

                  {crop.expectedHarvestDate && (
                    <div className="flex justify-between">
                      <span>Expected Harvest:</span>
                      <span className="font-medium">{new Date(crop.expectedHarvestDate).toLocaleDateString()}</span>
                    </div>
                  )}

                  {crop.estimatedYield && (
                    <div className="flex justify-between">
                      <span>Est. Yield:</span>
                      <span className="font-medium">{crop.estimatedYield?.toString()} {crop.unit}</span>
                    </div>
                  )}

                  {crop.pricePerUnit && (
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-medium">₹{crop.pricePerUnit?.toString()}/{crop.unit}</span>
                    </div>
                  )}
                </div>

                {crop.description && (
                  <p className="mt-3 text-sm text-gray-900 line-clamp-2">
                    {crop.description}
                  </p>
                )}

                <div className="mt-6 flex flex-col gap-3">
                  <div className="flex gap-2">
                    <Link
                      href={`/dashboard/crops/${crop.id}`}
                      className="flex-1 text-center inline-flex items-center justify-center gap-1 px-4 py-2 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-lg text-sm font-semibold hover:from-gray-200 hover:to-gray-300 transition-all duration-200 transform hover:scale-105"
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </Link>
                    <Link
                      href={`/dashboard/crops/${crop.id}/edit`}
                      className="flex-1 text-center inline-flex items-center justify-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg text-sm font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit
                    </Link>
                  </div>

                  {}
                  <div className="flex flex-wrap gap-2">
                    {crop.status === 'planted' && (
                      <button
                        onClick={() => updateCropStatus(crop.id, 'growing')}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white text-xs font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
                      >
                        <Sprout className="w-4 h-4" />
                        Growing
                      </button>
                    )}

                    {crop.status === 'growing' && (
                      <button
                        onClick={() => updateCropStatus(crop.id, 'ready_to_harvest')}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white text-xs font-semibold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 transform hover:scale-105"
                      >
                        <Wheat className="w-4 h-4" />
                        Ready
                      </button>
                    )}

                    {crop.status === 'ready_to_harvest' && (
                      <button
                        onClick={() => updateCropStatus(crop.id, 'harvested')}
                        className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-semibold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Harvested
                      </button>
                    )}

                    {crop.status === 'harvested' && (
                      <Link
                        href={`/dashboard/sell?crop=${crop.id}`}
                        className="flex-1 text-center inline-flex items-center justify-center gap-1 px-3 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-xs font-semibold rounded-lg hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 transform hover:scale-105"
                      >
                        <Store className="w-4 h-4" />
                        Sell
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  )
}