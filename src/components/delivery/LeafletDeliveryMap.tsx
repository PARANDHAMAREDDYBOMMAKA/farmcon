'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface DeliveryMapProps {
  order: {
    id: string
    status: string
    shipping_address: any
    seller?: {
      full_name?: string
      address?: string
      city?: string
      state?: string
    }
  }
  className?: string
}

interface DeliveryData {
  id: string
  status: string
  pickupLatitude: number | null
  pickupLongitude: number | null
  pickupAddress: string | null
  deliveryLatitude: number | null
  deliveryLongitude: number | null
  deliveryAddress: string | null
  driver?: {
    fullName: string
    phone: string
    vehicleType: string
    vehicleNumber: string
    currentLatitude: number | null
    currentLongitude: number | null
    lastLocationUpdate: string | null
  }
  locationHistory: Array<{
    latitude: number
    longitude: number
    timestamp: string
  }>
  milestones: Array<{
    milestone: string
    description: string
    latitude: number | null
    longitude: number | null
    completedAt: string
  }>
}

// Custom marker icons
const createWaypointIcon = (isCompleted: boolean, isCurrent: boolean, index: number) => {
  const backgroundColor = isCompleted ? '#10B981' : isCurrent ? '#3B82F6' : '#9CA3AF'
  return L.divIcon({
    className: 'waypoint-marker',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background-color: ${backgroundColor};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        color: white;
        font-weight: bold;
        font-size: 14px;
      ">
        ${index + 1}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

const driverIcon = L.divIcon({
  className: 'driver-marker',
  html: `
    <div style="
      font-size: 32px;
      animation: bounce 1s infinite;
    ">
      🚚
    </div>
    <style>
      @keyframes bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
    </style>
  `,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
})

export default function LeafletDeliveryMap({
  order,
  className = 'h-96 w-full rounded-lg overflow-hidden shadow-lg'
}: DeliveryMapProps) {
  const [deliveryData, setDeliveryData] = useState<DeliveryData | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Fetch delivery data
  useEffect(() => {
    const fetchDeliveryData = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/deliveries?orderId=${order.id}`)
        const data = await response.json()

        if (data.deliveries && data.deliveries.length > 0) {
          setDeliveryData(data.deliveries[0])
        } else {
          // No delivery record exists yet - this is okay for new orders
          setDeliveryData(null)
        }
      } catch (err) {
        console.error('Error fetching delivery data:', err)
        setError('Failed to load delivery tracking')
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveryData()
  }, [order.id])

  // Poll for location updates when order is shipped
  useEffect(() => {
    if (order.status === 'shipped' && deliveryData) {
      const pollInterval = setInterval(async () => {
        try {
          const response = await fetch(`/api/deliveries?orderId=${order.id}`)
          const data = await response.json()
          if (data.deliveries && data.deliveries.length > 0) {
            setDeliveryData(data.deliveries[0])
          }
        } catch (err) {
          console.error('Error polling delivery data:', err)
        }
      }, 30000) // Poll every 30 seconds

      return () => clearInterval(pollInterval)
    }
  }, [order.status, order.id, deliveryData])

  const parseDeliveryAddress = () => {
    try {
      const shippingAddress = typeof order.shipping_address === 'string'
        ? JSON.parse(order.shipping_address)
        : order.shipping_address

      const city = shippingAddress.address?.city || shippingAddress.city || 'Kalakada'
      const line1 = shippingAddress.address?.line1 || shippingAddress.line1 || ''
      const state = shippingAddress.address?.state || shippingAddress.state || 'AP'

      return `${line1}, ${city}, ${state}`
    } catch (error) {
      return 'Kalakada, Andhra Pradesh'
    }
  }

  if (!isMounted || loading) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <p className="text-gray-600">Loading map...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`${className} flex items-center justify-center bg-red-50`}>
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  // If no delivery data and order is not shipped yet, show message
  if (!deliveryData && !['shipped', 'delivered'].includes(order.status)) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center p-4">
          <p className="text-gray-600">Delivery tracking will be available once your order is shipped</p>
          <p className="text-sm text-gray-500 mt-2">Order Status: {order.status}</p>
        </div>
      </div>
    )
  }

  // Get pickup and delivery coordinates
  const pickupLat = deliveryData?.pickupLatitude ? Number(deliveryData.pickupLatitude) : 17.3850
  const pickupLng = deliveryData?.pickupLongitude ? Number(deliveryData.pickupLongitude) : 78.4867
  const deliveryLat = deliveryData?.deliveryLatitude ? Number(deliveryData.deliveryLatitude) : 13.6168
  const deliveryLng = deliveryData?.deliveryLongitude ? Number(deliveryData.deliveryLongitude) : 79.5460

  // Get driver location if available
  const driverLat = deliveryData?.driver?.currentLatitude ? Number(deliveryData.driver.currentLatitude) : null
  const driverLng = deliveryData?.driver?.currentLongitude ? Number(deliveryData.driver.currentLongitude) : null

  // Create route coordinates
  const routeCoordinates: [number, number][] = []
  if (pickupLat && pickupLng && deliveryLat && deliveryLng) {
    routeCoordinates.push([pickupLat, pickupLng])

    // Add milestone locations if available
    if (deliveryData?.milestones) {
      deliveryData.milestones.forEach(milestone => {
        if (milestone.latitude && milestone.longitude) {
          routeCoordinates.push([Number(milestone.latitude), Number(milestone.longitude)])
        }
      })
    }

    // Add driver location if in transit
    if (driverLat && driverLng && ['shipped', 'in_transit', 'out_for_delivery'].includes(order.status)) {
      routeCoordinates.push([driverLat, driverLng])
    }

    routeCoordinates.push([deliveryLat, deliveryLng])
  }

  // Calculate map center
  const centerLat = (pickupLat + deliveryLat) / 2
  const centerLng = (pickupLng + deliveryLng) / 2

  return (
    <div className={className}>
      <MapContainer
        center={[centerLat, centerLng]}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route line */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            color={order.status === 'delivered' ? '#10B981' : '#3B82F6'}
            weight={4}
            opacity={0.8}
          />
        )}

        {/* Pickup location marker */}
        <Marker
          position={[pickupLat, pickupLng]}
          icon={createWaypointIcon(true, false, 0)}
          eventHandlers={{
            click: () => setSelectedMarker('pickup')
          }}
        >
          {selectedMarker === 'pickup' && (
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-green-600">Pickup Location</h3>
                <p className="text-sm text-gray-600">
                  {deliveryData?.pickupAddress || `${order.seller?.city}, ${order.seller?.state}`}
                </p>
                <p className="text-xs text-green-600 mt-1">📦 Origin</p>
              </div>
            </Popup>
          )}
        </Marker>

        {/* Delivery location marker */}
        <Marker
          position={[deliveryLat, deliveryLng]}
          icon={createWaypointIcon(order.status === 'delivered', false, 1)}
          eventHandlers={{
            click: () => setSelectedMarker('delivery')
          }}
        >
          {selectedMarker === 'delivery' && (
            <Popup>
              <div className="p-2 min-w-[200px]">
                <h3 className="font-semibold text-blue-600">Delivery Location</h3>
                <p className="text-sm text-gray-600">
                  {deliveryData?.deliveryAddress || parseDeliveryAddress()}
                </p>
                <p className="text-xs text-blue-600 mt-1">📍 Destination</p>
              </div>
            </Popup>
          )}
        </Marker>

        {/* Driver location marker for active deliveries */}
        {driverLat && driverLng && ['shipped', 'in_transit', 'out_for_delivery'].includes(order.status) && (
          <Marker
            position={[driverLat, driverLng]}
            icon={driverIcon}
            eventHandlers={{
              click: () => setSelectedMarker('driver')
            }}
          >
            {selectedMarker === 'driver' && (
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold text-red-600">
                    {deliveryData?.driver?.fullName || 'Delivery Driver'}
                  </h3>
                  <p className="text-sm text-gray-600">Your order is on the way!</p>
                  <div className="mt-2 space-y-1 text-xs">
                    {deliveryData?.driver?.vehicleType && (
                      <p className="text-gray-600">🚛 {deliveryData.driver.vehicleType} - {deliveryData.driver.vehicleNumber}</p>
                    )}
                    {deliveryData?.driver?.phone && (
                      <p className="text-blue-600">📞 {deliveryData.driver.phone}</p>
                    )}
                    <p className="text-green-600">📦 Order #{order.id.slice(-8)}</p>
                    {deliveryData?.driver?.lastLocationUpdate && (
                      <p className="text-gray-500">
                        ⏱️ Updated: {new Date(deliveryData.driver.lastLocationUpdate).toLocaleTimeString()}
                      </p>
                    )}
                  </div>
                </div>
              </Popup>
            )}
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
