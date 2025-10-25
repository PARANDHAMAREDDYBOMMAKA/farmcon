'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

interface Driver {
  id: string
  fullName: string
  phone: string
  vehicleType: string
  vehicleNumber: string
  currentLatitude: number | null
  currentLongitude: number | null
  lastLocationUpdate: string | null
}

interface Delivery {
  id: string
  status: string
  trackingNumber: string | null
  pickupAddress: string | null
  deliveryAddress: string | null
  order: {
    id: string
    totalAmount: number
    customer: {
      fullName: string
      phone: string
    }
  }
}

export default function DriverDashboard() {
  const [driverPhone, setDriverPhone] = useState('')
  const [driver, setDriver] = useState<Driver | null>(null)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(false)
  const [locationTracking, setLocationTracking] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)

  const loginDriver = async () => {
    if (!driverPhone) {
      toast.error('Please enter your phone number')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/drivers')
      const data = await response.json()

      const foundDriver = data.drivers?.find((d: Driver) => d.phone === driverPhone)

      if (foundDriver) {
        setDriver(foundDriver)
        localStorage.setItem('driverId', foundDriver.id)
        loadDeliveries(foundDriver.id)
        toast.success(`Welcome back, ${foundDriver.fullName}!`)
      } else {
        toast.error('Driver not found. Please check your phone number.')
      }
    } catch (error) {
      console.error('Error logging in:', error)
      toast.error('Failed to login')
    } finally {
      setLoading(false)
    }
  }

  const loadDeliveries = async (driverId: string) => {
    try {
      const response = await fetch(`/api/deliveries?driverId=${driverId}`)
      const data = await response.json()

      const activeDeliveries = data.deliveries?.filter((d: Delivery) =>
        ['assigned', 'picked_up', 'in_transit', 'out_for_delivery'].includes(d.status)
      ) || []

      setDeliveries(activeDeliveries)
    } catch (error) {
      console.error('Error loading deliveries:', error)
      toast.error('Failed to load deliveries')
    }
  }

  const startLocationTracking = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser')
      return
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy, speed, heading } = position.coords
        updateAllDeliveryLocations(latitude, longitude, accuracy, speed, heading)
      },
      (error) => {
        console.error('Geolocation error:', error)
        toast.error('Failed to get location. Please enable location services.')
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 0
      }
    )

    setWatchId(id)
    setLocationTracking(true)
    toast.success('Location tracking started')
  }

  const stopLocationTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
      setLocationTracking(false)
      toast.success('Location tracking stopped')
    }
  }

  const updateAllDeliveryLocations = async (
    latitude: number,
    longitude: number,
    accuracy?: number | null,
    speed?: number | null,
    heading?: number | null
  ) => {
    
    for (const delivery of deliveries) {
      try {
        await fetch(`/api/deliveries/${delivery.id}/location`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            latitude,
            longitude,
            accuracy,
            speed,
            heading
          })
        })
      } catch (error) {
        console.error(`Error updating location for delivery ${delivery.id}:`, error)
      }
    }

    if (driver) {
      try {
        await fetch(`/api/drivers/${driver.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentLatitude: latitude,
            currentLongitude: longitude
          })
        })
      } catch (error) {
        console.error('Error updating driver location:', error)
      }
    }
  }

  const updateDeliveryStatus = async (deliveryId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/deliveries/${deliveryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      if (response.ok) {
        toast.success('Delivery status updated')
        if (driver) {
          loadDeliveries(driver.id)
        }
      } else {
        toast.error('Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    }
  }

  useEffect(() => {
    const savedDriverId = localStorage.getItem('driverId')
    if (savedDriverId) {
      fetch(`/api/drivers/${savedDriverId}`)
        .then(res => res.json())
        .then(data => {
          if (data.driver) {
            setDriver(data.driver)
            loadDeliveries(savedDriverId)
          }
        })
        .catch(console.error)
    }
  }, [])

  if (!driver) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
            Driver Login
          </h1>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                value={driverPhone}
                onChange={(e) => setDriverPhone(e.target.value)}
                placeholder="Enter your phone number"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={loginDriver}
              disabled={loading}
              className="w-full bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{driver.fullName}</h1>
              <p className="text-gray-900">{driver.vehicleType} - {driver.vehicleNumber}</p>
              <p className="text-sm text-gray-900">{driver.phone}</p>
            </div>
            <button
              onClick={() => {
                setDriver(null)
                localStorage.removeItem('driverId')
                stopLocationTracking()
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>

        {}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Location Tracking</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-900">
                {locationTracking ? 'Location tracking is active' : 'Start tracking to update delivery locations'}
              </p>
              {driver.lastLocationUpdate && (
                <p className="text-sm text-gray-900 mt-1">
                  Last update: {new Date(driver.lastLocationUpdate).toLocaleString()}
                </p>
              )}
            </div>
            <button
              onClick={locationTracking ? stopLocationTracking : startLocationTracking}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${
                locationTracking
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              {locationTracking ? 'Stop Tracking' : 'Start Tracking'}
            </button>
          </div>
        </div>

        {}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Active Deliveries ({deliveries.length})
          </h2>

          {deliveries.length === 0 ? (
            <p className="text-gray-900 text-center py-8">No active deliveries</p>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <div key={delivery.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        Order #{delivery.order.id.slice(-8)}
                      </h3>
                      {delivery.trackingNumber && (
                        <p className="text-sm text-gray-900">
                          Tracking: {delivery.trackingNumber}
                        </p>
                      )}
                      <p className="text-sm text-gray-900 mt-1">
                        Customer: {delivery.order.customer.fullName}
                      </p>
                      <p className="text-sm text-gray-900">
                        Phone: {delivery.order.customer.phone}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        delivery.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                        delivery.status === 'picked_up' ? 'bg-yellow-100 text-yellow-800' :
                        delivery.status === 'in_transit' ? 'bg-purple-100 text-purple-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {delivery.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <p className="text-sm font-semibold text-gray-900 mt-2">
                        ₹{delivery.order.totalAmount}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-3">
                    <div className="flex items-start">
                      <span className="text-lg mr-2">📦</span>
                      <div>
                        <p className="text-xs text-gray-900">Pickup</p>
                        <p className="text-sm text-gray-700">{delivery.pickupAddress || 'Not specified'}</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <span className="text-lg mr-2">📍</span>
                      <div>
                        <p className="text-xs text-gray-900">Delivery</p>
                        <p className="text-sm text-gray-700">{delivery.deliveryAddress || 'Not specified'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {delivery.status === 'assigned' && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery.id, 'picked_up')}
                        className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-700"
                      >
                        Mark as Picked Up
                      </button>
                    )}
                    {delivery.status === 'picked_up' && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery.id, 'in_transit')}
                        className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-purple-700"
                      >
                        Start Transit
                      </button>
                    )}
                    {delivery.status === 'in_transit' && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery.id, 'out_for_delivery')}
                        className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700"
                      >
                        Out for Delivery
                      </button>
                    )}
                    {delivery.status === 'out_for_delivery' && (
                      <button
                        onClick={() => updateDeliveryStatus(delivery.id, 'delivered')}
                        className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                      >
                        Mark as Delivered
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
