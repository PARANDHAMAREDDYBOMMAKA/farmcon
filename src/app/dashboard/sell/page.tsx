'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { profileAPI, cropsAPI } from '@/lib/api-client'
import type { User, Crop } from '@/types'

function SellCropsPageInternal() {
  const [user, setUser] = useState<User | null>(null)
  const [crops, setCrops] = useState<Crop[]>([])
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  const [listingData, setListingData] = useState({
    quantity_available: '',
    price_per_unit: '',
    harvest_date: '',
    expiry_date: '',
    delivery_available: false,
    pickup_location: '',
    description: ''
  })

  useEffect(() => {
    loadData()

    const cropId = searchParams?.get('crop')
    if (cropId) {
      
    }
  }, [searchParams])

  const loadData = async () => {
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

      const cropsData = await cropsAPI.getCrops(session.user.id)

      const listingsResponse = await fetch(`/api/crop-listings?farmerId=${session.user.id}&isActive=true`)
      const existingListings = listingsResponse.ok ? (await listingsResponse.json()).cropListings : []
      const listedCropIds = new Set(existingListings.map((listing: any) => listing.cropId))

      const harvestedCrops = cropsData.filter(crop => 
        crop.status === 'harvested' && !listedCropIds.has(crop.id)
      )
      setCrops(harvestedCrops)

      const cropId = searchParams?.get('crop')
      if (cropId) {
        const crop = harvestedCrops.find(c => c.id === cropId)
        if (crop) {
          setSelectedCrop(crop)
          
          setListingData(prev => ({
            ...prev,
            harvest_date: crop.actualHarvestDate ? new Date(crop.actualHarvestDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
            pickup_location: profile.city ? `${profile.city}, ${profile.state}` : ''
          }))
        }
      }
    } catch (error) {
      console.error('Error loading data:', error)
      setError('Failed to load crops')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement
      setListingData(prev => ({
        ...prev,
        [name]: target.checked
      }))
    } else {
      setListingData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleCropSelect = (crop: Crop) => {
    setSelectedCrop(crop)
    
    setListingData(prev => ({
      ...prev,
      harvest_date: crop.actualHarvestDate ? new Date(crop.actualHarvestDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      pickup_location: user?.city ? `${user.city}, ${user.state}` : ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !selectedCrop) return

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      
      if (!listingData.quantity_available || !listingData.price_per_unit) {
        setError('Please fill in all required fields')
        return
      }

      const cropListingData = {
        cropId: selectedCrop.id,
        farmerId: user.id,
        quantityAvailable: parseFloat(listingData.quantity_available),
        pricePerUnit: parseFloat(listingData.price_per_unit),
        unit: selectedCrop.unit,
        harvestDate: listingData.harvest_date || null,
        expiryDate: listingData.expiry_date || null,
        deliveryAvailable: listingData.delivery_available,
        pickupLocation: listingData.pickup_location || null,
        images: selectedCrop.images || [],
        description: listingData.description || null,
        isActive: true
      }

      const listingResponse = await fetch('/api/crop-listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cropListingData)
      })

      if (!listingResponse.ok) {
        const error = await listingResponse.json()
        throw new Error(error.error || 'Failed to create listing')
      }

      setSuccess('Crop listed for sale successfully!')

      setSelectedCrop(null)
      setListingData({
        quantity_available: '',
        price_per_unit: '',
        harvest_date: '',
        expiry_date: '',
        delivery_available: false,
        pickup_location: '',
        description: ''
      })

      loadData()

    } catch (err: any) {
      console.error('Error creating listing:', err)
      setError(err.message || 'Failed to list crop')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading crops...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Sell Your Crops</h1>
          <p className="text-gray-900">List your harvested crops for sale in the marketplace</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-md">
            {success}
          </div>
        )}

        {crops.length === 0 ? (
          <div className="text-center py-12">
            <span className="text-6xl">🌾</span>
            <h3 className="mt-4 text-lg font-medium text-gray-900">No harvested crops</h3>
            <p className="mt-2 text-gray-900">
              You need to have harvested crops before you can list them for sale.
            </p>
            <Link
              href="/dashboard/crops"
              className="mt-6 inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
            >
              Manage Your Crops
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Crop to Sell</h2>
              <div className="space-y-3">
                {crops.map((crop) => (
                  <button
                    key={crop.id}
                    onClick={() => handleCropSelect(crop)}
                    className={`w-full text-left p-4 rounded-lg border ${
                      selectedCrop?.id === crop.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      {crop.images && crop.images.length > 0 ? (
                        <img
                          src={crop.images[0]}
                          alt={crop.name}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-xl">🌾</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900">
                          {crop.name} {crop.variety && `(${crop.variety})`}
                        </h3>
                        <p className="text-sm text-gray-900">
                          {crop.area?.toString()} acres • Harvested {crop.actualHarvestDate ? 
                            new Date(crop.actualHarvestDate).toLocaleDateString() : 
                            'Recently'
                          }
                        </p>
                        {crop.actualYield && (
                          <p className="text-sm text-gray-900">
                            Yield: {crop.actualYield?.toString()} {crop.unit}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {}
            <div className="lg:col-span-2">
              {selectedCrop ? (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Create Listing for {selectedCrop.name}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="quantity_available" className="block text-sm font-medium text-gray-700">
                        Quantity Available * ({selectedCrop.unit})
                      </label>
                      <input
                        type="number"
                        id="quantity_available"
                        name="quantity_available"
                        required
                        min="0"
                        step="0.1"
                        value={listingData.quantity_available}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                        placeholder={`Enter quantity in ${selectedCrop.unit}`}
                      />
                      {selectedCrop.actualYield && (
                        <p className="mt-1 text-sm text-gray-900">
                          Total yield: {selectedCrop.actualYield.toString()} {selectedCrop.unit}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="price_per_unit" className="block text-sm font-medium text-gray-700">
                        Price per {selectedCrop.unit} *
                      </label>
                      <div className="mt-1 relative">
                        <span className="absolute left-3 top-2 text-gray-900">₹</span>
                        <input
                          type="number"
                          id="price_per_unit"
                          name="price_per_unit"
                          required
                          min="0"
                          step="0.01"
                          value={listingData.price_per_unit}
                          onChange={handleInputChange}
                          className="pl-8 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor="harvest_date" className="block text-sm font-medium text-gray-700">
                        Harvest Date
                      </label>
                      <input
                        type="date"
                        id="harvest_date"
                        name="harvest_date"
                        value={listingData.harvest_date}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>

                    <div>
                      <label htmlFor="expiry_date" className="block text-sm font-medium text-gray-700">
                        Best Before Date
                      </label>
                      <input
                        type="date"
                        id="expiry_date"
                        name="expiry_date"
                        value={listingData.expiry_date}
                        onChange={handleInputChange}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="pickup_location" className="block text-sm font-medium text-gray-700">
                      Pickup Location
                    </label>
                    <input
                      type="text"
                      id="pickup_location"
                      name="pickup_location"
                      value={listingData.pickup_location}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Address where buyers can pickup"
                    />
                  </div>

                  <div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="delivery_available"
                        name="delivery_available"
                        checked={listingData.delivery_available}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                      />
                      <label htmlFor="delivery_available" className="ml-2 block text-sm text-gray-700">
                        Delivery Available
                      </label>
                    </div>
                    <p className="mt-1 text-sm text-gray-900">
                      Check if you can deliver to buyers
                    </p>
                  </div>

                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      rows={4}
                      value={listingData.description}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                      placeholder="Additional details about your crop..."
                    />
                  </div>

                  {}
                  {listingData.quantity_available && listingData.price_per_unit && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Listing Preview</h3>
                      <div className="text-sm space-y-1">
                        <p><span className="font-medium">Total Value:</span> ₹{(parseFloat(listingData.quantity_available) * parseFloat(listingData.price_per_unit)).toFixed(2)}</p>
                        <p><span className="font-medium">Quantity:</span> {listingData.quantity_available} {selectedCrop.unit}</p>
                        <p><span className="font-medium">Price:</span> ₹{listingData.price_per_unit} per {selectedCrop.unit}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-4">
                    <button
                      type="button"
                      onClick={() => setSelectedCrop(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {saving ? 'Creating Listing...' : 'List for Sale'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center">
                  <span className="text-4xl">👈</span>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Select a crop to sell</h3>
                  <p className="mt-2 text-gray-900">
                    Choose a harvested crop from the list to create a marketplace listing.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
export default function () {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-900">Loading...</p>
        </div>
      </div>
    }>
      <SellCropsPageInternal />
    </Suspense>
  )
}
