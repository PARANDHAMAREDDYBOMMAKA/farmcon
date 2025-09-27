'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { equipmentAPI } from '@/lib/api-client'

interface Equipment {
  id: string
  owner_id: string
  name: string
  category: string
  brand?: string
  model?: string
  year_manufactured?: number
  description?: string
  images: string[]
  hourly_rate?: number
  daily_rate?: number
  status: 'available' | 'rented' | 'maintenance' | 'unavailable'
  location?: string
  specifications?: Record<string, any>
  created_at: string
  updated_at: string
  owner: {
    full_name: string
    city?: string
    state?: string
    phone?: string
  }
}

export default function EquipmentRentalPage() {
  const { user, loading } = useAuth()
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('created_at')

  const categories = [
    'Tractor',
    'Harvester',
    'Plough',
    'Seeder',
    'Sprayer',
    'Thresher',
    'Cultivator',
    'Other'
  ]

  useEffect(() => {
    if (user) {
      loadEquipment()
    }
  }, [user])

  const loadEquipment = async () => {
    try {
      if (!user) return
      
      // Load equipment using API
      const equipmentData = await equipmentAPI.getEquipment()
      setEquipment(equipmentData || [])
    } catch (error) {
      console.error('Error loading equipment:', error)
    }
  }

  const contactOwner = (phone: string, equipmentName: string) => {
    if (phone) {
      window.open(`tel:${phone}`, '_self')
    } else {
      toast.error(`Contact information not available for ${equipmentName}`)
    }
  }

  const filteredEquipment = equipment
    .filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.owner.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCategory = selectedCategory === '' || item.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return (a.daily_rate || 0) - (b.daily_rate || 0)
        case 'price_high':
          return (b.daily_rate || 0) - (a.daily_rate || 0)
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created_at':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
    })

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading equipment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Equipment Rental</h1>
            <p className="text-gray-600">Rent farming equipment from fellow farmers</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/dashboard/equipment/add"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
            >
              + List Your Equipment
            </Link>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <input
            type="text"
            placeholder="Search equipment, owner..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        
        <div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="created_at">Latest First</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="name">Name A-Z</option>
          </select>
        </div>

        <div className="text-sm text-gray-500 flex items-center">
          {filteredEquipment.length} equipment available
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredEquipment.map((item) => (
          <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
              {item.images && item.images.length > 0 ? (
                <img
                  src={item.images[0]}
                  alt={item.name}
                  className="h-48 w-full object-cover object-center"
                />
              ) : (
                <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl">🚜</span>
                </div>
              )}
            </div>

            <div className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-sm text-gray-600">{item.category}</p>
                  {item.brand && (
                    <p className="text-sm text-gray-500">{item.brand} {item.model}</p>
                  )}
                </div>
                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  Available
                </span>
              </div>

              <div className="mt-3">
                <p className="text-sm text-gray-600">
                  Owner: <span className="font-medium">{item.owner.full_name}</span>
                </p>
                <p className="text-sm text-gray-500">
                  📍 {item.location || `${item.owner.city}, ${item.owner.state}`}
                </p>
              </div>

              {item.year_manufactured && (
                <p className="text-sm text-gray-500 mt-1">
                  Year: {item.year_manufactured}
                </p>
              )}

              <div className="mt-3">
                <div className="flex justify-between items-center">
                  {item.hourly_rate && (
                    <div>
                      <p className="text-lg font-bold text-gray-900">₹{item.hourly_rate}</p>
                      <p className="text-xs text-gray-500">per hour</p>
                    </div>
                  )}
                  {item.daily_rate && (
                    <div>
                      <p className="text-lg font-bold text-gray-900">₹{item.daily_rate}</p>
                      <p className="text-xs text-gray-500">per day</p>
                    </div>
                  )}
                </div>
              </div>

              {item.description && (
                <p className="text-sm text-gray-600 mt-3 line-clamp-2">
                  {item.description}
                </p>
              )}

              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => contactOwner(item.owner.phone || '', item.name)}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700"
                >
                  📞 Contact
                </button>
                <Link
                  href={`/dashboard/equipment/${item.id}`}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Details
                </Link>
              </div>

              {item.specifications && Object.keys(item.specifications).length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Key Specs
                  </h4>
                  <div className="mt-1 space-y-1">
                    {Object.entries(item.specifications).slice(0, 2).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-xs">
                        <span className="text-gray-500">{key}:</span>
                        <span className="text-gray-900">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredEquipment.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl">🚜</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No equipment found</h3>
          <p className="mt-2 text-gray-500">
            Try adjusting your search or filters. Be the first to list equipment for rent!
          </p>
          <Link
            href="/dashboard/equipment/add"
            className="mt-6 inline-flex items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-green-600 hover:bg-green-700"
          >
            List Your Equipment
          </Link>
        </div>
      )}
    </div>
  )
}