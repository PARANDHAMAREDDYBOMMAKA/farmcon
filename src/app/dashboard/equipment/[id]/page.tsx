'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { equipmentAPI } from '@/lib/api-client'
import { Truck, MapPin, Phone, Mail, XCircle } from 'lucide-react'

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
    email?: string
  }
}

export default function EquipmentDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const [equipment, setEquipment] = useState<Equipment | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [rentalDuration, setRentalDuration] = useState(1)
  const [rentalType, setRentalType] = useState<'hourly' | 'daily'>('daily')
  const router = useRouter()
  const params = useParams()
  const equipmentId = params?.id as string

  useEffect(() => {
    if (equipmentId && user && !authLoading) {
      loadEquipment()
    }
  }, [equipmentId, user, authLoading])

  const loadEquipment = async () => {
    if (!user) return
    
    try {
      
      const equipmentData = await equipmentAPI.getEquipmentById(equipmentId)
      
      if (!equipmentData) {
        console.error('Equipment not found')
        router.push('/dashboard/equipment')
        return
      }

      setEquipment(equipmentData as Equipment)

      if (equipmentData.hourly_rate && !equipmentData.daily_rate) {
        setRentalType('hourly')
      } else if (equipmentData.daily_rate && !equipmentData.hourly_rate) {
        setRentalType('daily')
      } else if (equipmentData.daily_rate) {
        setRentalType('daily') 
      }

    } catch (error) {
      console.error('Error loading equipment:', error)
      router.push('/dashboard/equipment')
    } finally {
      setLoading(false)
    }
  }

  const contactOwner = (method: 'phone' | 'email') => {
    if (!equipment?.owner) return
    
    if (method === 'phone' && equipment.owner.phone) {
      window.open(`tel:${equipment.owner.phone}`, '_self')
    } else if (method === 'email' && equipment.owner.email) {
      const subject = `Interested in renting ${equipment.name}`
      const body = `Hi ${equipment.owner.full_name},\n\nI'm interested in renting your ${equipment.name} ${equipment.brand ? `(${equipment.brand}${equipment.model ? ` ${equipment.model}` : ''})` : ''}.\n\nCould you please provide more details about availability and rental terms?\n\nThanks!`
      window.open(`mailto:${equipment.owner.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, '_self')
    } else {
      toast.error(`${method.charAt(0).toUpperCase() + method.slice(1)} not available for this equipment owner`)
    }
  }

  const calculateTotal = () => {
    const rate = rentalType === 'hourly' ? equipment?.hourly_rate : equipment?.daily_rate
    return rate ? (rate * rentalDuration).toFixed(2) : '0'
  }

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-900">Loading equipment details...</p>
        </div>
      </div>
    )
  }

  if (!equipment) {
    return (
      <div className="p-6">
        <div className="text-center">
          <XCircle className="w-24 h-24 text-red-500 mx-auto" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Equipment not found</h3>
          <Link
            href="/dashboard/equipment"
            className="mt-4 inline-block text-green-600 hover:text-green-500"
          >
            ← Back to equipment listings
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
            <Link href="/dashboard/equipment" className="text-gray-900 hover:text-gray-700">
              Equipment Rental
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-900">/</span>
              <span className="text-gray-900">{equipment.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {}
        <div>
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
            {equipment.images && equipment.images.length > 0 ? (
              <img
                src={equipment.images[selectedImageIndex]}
                alt={equipment.name}
                className="h-96 w-full object-cover object-center"
              />
            ) : (
              <div className="h-96 w-full bg-gray-200 flex items-center justify-center">
                <Truck className="w-32 h-32 text-gray-900" />
              </div>
            )}
          </div>
          {equipment.images && equipment.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {equipment.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-w-1 aspect-h-1 overflow-hidden rounded-lg ${
                    selectedImageIndex === index ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${equipment.name} ${index + 1}`}
                    className="h-20 w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {}
        <div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
              {equipment.brand && (
                <p className="text-lg text-gray-900">
                  {equipment.brand} {equipment.model && `${equipment.model}`}
                </p>
              )}
              <p className="text-sm text-gray-900">{equipment.category}</p>
            </div>
            <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
              equipment.status === 'available' 
                ? 'bg-green-100 text-green-800' 
                : equipment.status === 'rented'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {equipment.status.charAt(0).toUpperCase() + equipment.status.slice(1)}
            </span>
          </div>

          {}
          <div className="mt-4">
            <div className="flex flex-wrap gap-4">
              {equipment.hourly_rate && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">₹{equipment.hourly_rate}</p>
                  <p className="text-sm text-gray-900">per hour</p>
                </div>
              )}
              {equipment.daily_rate && (
                <div>
                  <p className="text-2xl font-bold text-gray-900">₹{equipment.daily_rate}</p>
                  <p className="text-sm text-gray-900">per day</p>
                </div>
              )}
            </div>
          </div>

          {}
          <div className="mt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {equipment.year_manufactured && (
                <div>
                  <span className="text-gray-900">Year:</span>
                  <span className="ml-2 font-medium">{equipment.year_manufactured}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <span className="text-gray-900">Location:</span>
                <span className="ml-2 font-medium flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {equipment.location || `${equipment.owner.city}, ${equipment.owner.state}`}
                </span>
              </div>
            </div>
          </div>

          {}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Owner Information</h3>
            <div className="space-y-2">
              <div>
                <span className="text-gray-900">Name:</span>
                <span className="ml-2 font-medium">{equipment.owner.full_name}</span>
              </div>
              <div>
                <span className="text-gray-900">Location:</span>
                <span className="ml-2 font-medium">{equipment.owner.city}, {equipment.owner.state}</span>
              </div>
            </div>
          </div>

          {equipment.description && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-900">{equipment.description}</p>
            </div>
          )}

          {}
          {equipment.specifications && Object.keys(equipment.specifications).length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Specifications</h3>
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(equipment.specifications).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-900 capitalize">{key.replace(/_/g, ' ')}:</span>
                    <span className="font-medium text-gray-900">{String(value)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {}
          {equipment.status === 'available' && (equipment.hourly_rate || equipment.daily_rate) && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Calculate Rental Cost</h3>
              
              <div className="space-y-4">
                {}
                {equipment.hourly_rate && equipment.daily_rate && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rental Type
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="rentalType"
                          value="hourly"
                          checked={rentalType === 'hourly'}
                          onChange={(e) => setRentalType(e.target.value as 'hourly')}
                          className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Hourly (₹{equipment.hourly_rate}/hr)
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="rentalType"
                          value="daily"
                          checked={rentalType === 'daily'}
                          onChange={(e) => setRentalType(e.target.value as 'daily')}
                          className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          Daily (₹{equipment.daily_rate}/day)
                        </span>
                      </label>
                    </div>
                  </div>
                )}

                {}
                <div>
                  <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                    Duration ({rentalType === 'hourly' ? 'hours' : 'days'})
                  </label>
                  <input
                    type="number"
                    id="duration"
                    min="1"
                    max={rentalType === 'hourly' ? "24" : "30"}
                    value={rentalDuration}
                    onChange={(e) => setRentalDuration(parseInt(e.target.value) || 1)}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {}
                <div className="pt-2 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-gray-900">Total Cost:</span>
                    <span className="text-2xl font-bold text-green-600">₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          <div className="mt-8 space-y-4">
            <div className="flex space-x-4">
              <button
                onClick={() => contactOwner('phone')}
                className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                disabled={!equipment.owner.phone}
              >
                <Phone className="w-5 h-5" />
                Call Owner
              </button>
              <button
                onClick={() => contactOwner('email')}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-blue-700 flex items-center justify-center gap-2"
                disabled={!equipment.owner.email}
              >
                <Mail className="w-5 h-5" />
                Email Owner
              </button>
            </div>
            
            <div className="text-center">
              <p className="text-sm text-gray-900">
                Contact the owner directly to arrange rental terms and schedule pickup/delivery
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}