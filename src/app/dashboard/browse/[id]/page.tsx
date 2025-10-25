'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
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
    plantedDate?: string
    area?: number
  }
  farmer: {
    fullName: string
    city?: string
    state?: string
    phone?: string
  }
}

export default function CropDetailPage() {
  const [user, setUser] = useState<User | null>(null)
  const [listing, setListing] = useState<CropListingWithDetails | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [cartLoading, setCartLoading] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const router = useRouter()
  const params = useParams()
  const listingId = params?.id as string

  useEffect(() => {
    if (listingId) {
      loadListing()
    }
  }, [listingId])

  const loadListing = async () => {
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

      const response = await fetch(`/api/crop-listings/${listingId}`)
      if (response.ok) {
        const { cropListing } = await response.json()
        setListing(cropListing)
      } else {
        console.error('Failed to fetch listing')
        router.push('/dashboard/browse')
        return
      }

    } catch (error) {
      console.error('Error loading listing:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async () => {
    if (!user || !listing) return
    
    setCartLoading(true)
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          cropListingId: listing.id,
          quantity
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to cart')
      }

      toast.success('Added to cart successfully!')

    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    } finally {
      setCartLoading(false)
    }
  }

  const buyNow = async () => {
    await addToCart()
    router.push('/dashboard/cart')
  }

  const isDaysFresh = (harvestDate: string | Date) => {
    const harvest = new Date(harvestDate)
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
          <p className="mt-4 text-gray-900">Loading crop details...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="p-6">
        <div className="text-center">
          <span className="text-6xl">❌</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Crop listing not found</h3>
          <Link
            href="/dashboard/browse"
            className="mt-4 inline-block text-green-600 hover:text-green-500"
          >
            ← Back to marketplace
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li>
            <Link href="/dashboard/browse" className="text-gray-900 hover:text-gray-700">
              Marketplace
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-900">/</span>
              <span className="text-gray-900">{listing.crop.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {}
        <div>
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
            {listing.images && listing.images.length > 0 ? (
              <img
                src={listing.images[selectedImageIndex]}
                alt={listing.crop.name}
                className="h-96 w-full object-cover object-center"
              />
            ) : (
              <div className="h-96 w-full bg-gray-200 flex items-center justify-center">
                <span className="text-8xl">🌾</span>
              </div>
            )}
          </div>
          {listing.images && listing.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {listing.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-w-1 aspect-h-1 overflow-hidden rounded-lg ${
                    selectedImageIndex === index ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${listing.crop.name} ${index + 1}`}
                    className="h-20 w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {}
        <div className='text-black'>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{listing.crop.name}</h1>
              {listing.crop.variety && (
                <p className="text-lg text-gray-900">{listing.crop.variety}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              {listing.crop.organicCertified && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-green-100 text-green-800">
                  🌿 Organic Certified
                </span>
              )}
              {listing.harvestDate && isDaysFresh(listing.harvestDate) && (
                <span className="inline-flex px-3 py-1 text-sm font-semibold rounded-full bg-blue-100 text-blue-800">
                  ✨ Fresh Harvest
                </span>
              )}
            </div>
          </div>



          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">₹{Number(listing.pricePerUnit)}</p>
            <p className="text-sm text-gray-900">per {listing.unit}</p>
          </div>

          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-gray-900">Available Quantity:</span>              <span className="font-medium text-gray-900">{Number(listing.quantityAvailable)} {listing.unit}</span>            </div>
            
            {listing.harvestDate && (
              <div className="flex items-center justify-between">
                <span className="text-gray-900">Harvested:</span>
                <span className="font-medium text-gray-900">{new Date(listing.harvestDate).toLocaleDateString('en-IN')}</span>
              </div>
            )}
            
            {listing.expiryDate && (
              <div className="flex items-center justify-between">
                <span className="text-gray-900">Best Before:</span>
                <span className="font-medium text-gray-900">{new Date(listing.expiryDate).toLocaleDateString('en-IN')}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-900">Delivery:</span>
              <span className={`font-medium ${listing.deliveryAvailable ? 'text-green-600' : 'text-gray-900'}`}>
                {listing.deliveryAvailable ? '✅ Available' : '❌ Pickup Only'}
              </span>
            </div>
          </div>

          {}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Farmer Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-gray-900">Name:</span>
                <span className="ml-2 font-medium">{listing.farmer.fullName}</span>
              </div>
              <div>
                <span className="text-gray-900">Location:</span>
                <span className="ml-2 font-medium">{listing.farmer.city}, {listing.farmer.state}</span>
              </div>
              {listing.crop.area && (
                <div>
                  <span className="text-gray-900">Farm Area:</span>
                  <span className="ml-2 font-medium">{Number(listing.crop.area)} acres</span>
                </div>
              )}
              {listing.crop.plantedDate && (
                <div>
                  <span className="text-gray-900">Planted:</span>
                  <span className="ml-2 font-medium">{new Date(listing.crop.plantedDate).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {listing.description && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-900">{listing.description}</p>
            </div>
          )}

          {listing.pickupLocation && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Pickup Location</h3>
              <p className="text-gray-900">📍 {listing.pickupLocation}</p>
            </div>
          )}

          {}
          <div className="mt-6">
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-900">
                Quantity:
              </label>
              <select
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {[...Array(Math.min(20, Math.max(1, Math.floor(Number(listing.quantityAvailable) || 1))))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1} {listing.unit}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-900">
                (Max: {Number(listing.quantityAvailable)} {listing.unit})
              </span>
            </div>
          </div>

          {}
          <div className="mt-8 flex space-x-4">
            <button
              onClick={addToCart}
              disabled={cartLoading}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {cartLoading ? 'Adding to Cart...' : 'Add to Cart'}
            </button>
            <button
              onClick={buyNow}
              disabled={cartLoading}
              className="flex-1 bg-green-800 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-green-900 disabled:opacity-50"
            >
              Buy Now
            </button>
          </div>

          {}
          <div className="mt-4">
            <p className="text-sm text-gray-900 text-center">
              Have questions? Contact the farmer directly at{' '}
              {listing.farmer.phone ? (
                <a href={`tel:${listing.farmer.phone}`} className="text-green-600 hover:text-green-700 font-medium">
                  {listing.farmer.phone}
                </a>
              ) : (
                'phone number not available'
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}