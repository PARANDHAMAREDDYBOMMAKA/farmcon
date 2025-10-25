'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { profileAPI } from '@/lib/api-client'
import type { User, CropListing } from '@/types'

interface CropListingWithDetails extends CropListing {
  crop: {
    name: string
    variety?: string
    organicCertified: boolean
  }
  farmer: {
    fullName: string
    city?: string
    state?: string
  }
}

export default function BrowseCropsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [cropListings, setCropListings] = useState<CropListingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('created_at')
  const [filterOrganic, setFilterOrganic] = useState(false)
  const [cartLoading, setCartLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadCropListings()
  }, [])

  const loadCropListings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/signin')
        return
      }

      const profile = await profileAPI.getProfile(session.user.id)

      if (profile) {
        setUser(profile)
      }

      const response = await fetch('/api/crop-listings')
      if (response.ok) {
        const { cropListings } = await response.json()
        setCropListings(cropListings || [])
      }
    } catch (error) {
      console.error('Error loading crop listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (listingId: string, quantity: number = 1) => {
    if (!user) return
    
    setCartLoading(listingId)
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          cropListingId: listingId,
          quantity: quantity
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to cart')
      }
      
      toast.success('Added to cart successfully! 🛒')

    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart. Please try again.')
    } finally {
      setCartLoading(null)
    }
  }

  const filteredListings = cropListings
    .filter(listing => {
      const matchesSearch = searchQuery === '' || 
        listing.crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.crop.variety?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.farmer.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesOrganic = !filterOrganic || listing.crop.organicCertified
      
      return matchesSearch && matchesOrganic
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return parseFloat(a.pricePerUnit.toString()) - parseFloat(b.pricePerUnit.toString())
        case 'price_high':
          return parseFloat(b.pricePerUnit.toString()) - parseFloat(a.pricePerUnit.toString())
        case 'name':
          return a.crop.name.localeCompare(b.crop.name)
        case 'created_at':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

  const isDaysFresh = (harvestDate: string | Date) => {
    const harvest = typeof harvestDate === 'string' ? new Date(harvestDate) : harvestDate
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - harvest.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays <= 7
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading fresh crops...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Fresh Crops Marketplace</h1>
            <p className="text-gray-900">Buy fresh crops directly from farmers</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/dashboard/cart"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-900 bg-white hover:bg-gray-50"
            >
              🛒 View Cart
            </Link>
          </div>
        </div>
      </div>

      {}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <input
            type="text"
            placeholder="Search crops, variety, farmer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
          />
        </div>
        
        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
          >
            <option value="created_at">Latest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="organic-filter"
            checked={filterOrganic}
            onChange={(e) => setFilterOrganic(e.target.checked)}
            className="h-4 w-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
          />
          <label htmlFor="organic-filter" className="ml-2 text-sm text-gray-900 font-medium">
            Organic Only
          </label>
        </div>

        <div className="text-sm text-gray-700 font-medium flex items-center">
          {filteredListings.length} crops available
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredListings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200 relative">
              {listing.images && listing.images.length > 0 ? (
                <img
                  src={listing.images[0]}
                  alt={listing.crop.name}
                  className="h-48 w-full object-cover object-center"
                />
              ) : (
                <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl">🌾</span>
                </div>
              )}
              
              {}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {listing.crop.organicCertified && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Organic
                  </span>
                )}
                {listing.harvestDate && isDaysFresh(listing.harvestDate) && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    Fresh
                  </span>
                )}
                {listing.deliveryAvailable && (
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                    Delivery
                  </span>
                )}
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {listing.crop.name}
              </h3>
              {listing.crop.variety && (
                <p className="text-sm text-gray-900">{listing.crop.variety}</p>
              )}

              <p className="text-sm text-gray-900 mt-1 font-semibold">
                by {listing.farmer.fullName}
              </p>
              <p className="text-xs text-gray-900">
                {listing.farmer.city}, {listing.farmer.state}
              </p>

              <div className="mt-3">
                <div className="flex items-baseline justify-between">
                  <div>
                    <p className="text-xl font-bold text-gray-900">
                      ₹{listing.pricePerUnit.toString()}
                    </p>
                    <p className="text-sm text-gray-900">per {listing.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">Available</p>
                    <p className="text-sm font-bold text-gray-900">{listing.quantityAvailable.toString()} {listing.unit}</p>
                  </div>
                </div>
              </div>

              {listing.harvestDate && (
                <p className="text-xs text-gray-900 mt-2">
                  Harvested: {new Date(listing.harvestDate).toLocaleDateString()}
                </p>
              )}

              {listing.expiryDate && (
                <p className="text-xs text-gray-900">
                  Best before: {new Date(listing.expiryDate).toLocaleDateString()}
                </p>
              )}

              {listing.description && (
                <p className="text-sm text-gray-900 mt-2 line-clamp-2">
                  {listing.description}
                </p>
              )}

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => addToCart(listing.id)}
                  disabled={cartLoading === listing.id}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  {cartLoading === listing.id ? 'Adding...' : 'Add to Cart'}
                </button>
                <Link
                  href={`/dashboard/browse/${listing.id}`}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-900 hover:bg-gray-50"
                >
                  View
                </Link>
              </div>

              {listing.pickupLocation && (
                <p className="text-xs text-gray-900 mt-2">
                  📍 Pickup: {listing.pickupLocation}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredListings.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl">🌾</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No crops found</h3>
          <p className="mt-2 text-gray-900">
            Try adjusting your search or filters. Check back later for fresh listings!
          </p>
        </div>
      )}
    </div>
  )
}