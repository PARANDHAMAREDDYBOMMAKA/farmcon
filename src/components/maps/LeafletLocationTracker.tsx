'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { LatLngExpression, Icon } from 'leaflet'

// Dynamic imports to avoid SSR issues
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false })
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false })
const Polyline = dynamic(() => import('react-leaflet').then(mod => mod.Polyline), { ssr: false })

interface LocationTrackerProps {
  orderId: string
  pickupLocation?: {
    lat: number
    lng: number
    address: string
  }
  deliveryLocation?: {
    lat: number
    lng: number
    address: string
  }
  driverLocation?: {
    lat: number
    lng: number
  }
  orderStatus: string
  className?: string
}

// Custom icons for different marker types
const createIcon = (color: string, symbol: string) => {
  if (typeof window === 'undefined') return undefined

  return new Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="12" font-weight="bold">${symbol}</text>
      </svg>
    `)}`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  })
}

function LeafletMap({
  pickupLocation,
  deliveryLocation,
  driverLocation,
  orderStatus
}: Omit<LocationTrackerProps, 'orderId' | 'className'>) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    // Import Leaflet CSS
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
    document.head.appendChild(link)

    return () => {
      if (document.head.contains(link)) {
        document.head.removeChild(link)
      }
    }
  }, [])

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  // Determine map center and zoom based on available locations
  const getMapCenter = (): LatLngExpression => {
    if (pickupLocation && deliveryLocation) {
      // Center between pickup and delivery
      return [
        (pickupLocation.lat + deliveryLocation.lat) / 2,
        (pickupLocation.lng + deliveryLocation.lng) / 2
      ]
    }
    if (pickupLocation) return [pickupLocation.lat, pickupLocation.lng]
    if (deliveryLocation) return [deliveryLocation.lat, deliveryLocation.lng]
    // Default to India center
    return [20.5937, 78.9629]
  }

  const mapCenter = getMapCenter()

  // Create route path if both locations are available
  const routePath: LatLngExpression[] = []
  if (pickupLocation && deliveryLocation && orderStatus !== 'pending') {
    routePath.push([pickupLocation.lat, pickupLocation.lng])
    if (driverLocation && orderStatus === 'shipped') {
      routePath.push([driverLocation.lat, driverLocation.lng])
    }
    routePath.push([deliveryLocation.lat, deliveryLocation.lng])
  }

  return (
    <MapContainer
      center={mapCenter}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {/* Pickup Location Marker */}
      {pickupLocation && (
        <Marker
          position={[pickupLocation.lat, pickupLocation.lng]}
          icon={createIcon('#10B981', 'P')}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-green-600">Pickup Location</h3>
              <p className="text-sm text-gray-600">{pickupLocation.address}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Delivery Location Marker */}
      {deliveryLocation && (
        <Marker
          position={[deliveryLocation.lat, deliveryLocation.lng]}
          icon={createIcon('#3B82F6', 'D')}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-blue-600">Delivery Location</h3>
              <p className="text-sm text-gray-600">{deliveryLocation.address}</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Driver Location Marker (only if order is shipped) */}
      {driverLocation && orderStatus === 'shipped' && (
        <Marker
          position={[driverLocation.lat, driverLocation.lng]}
          icon={createIcon('#EF4444', '🚚')}
        >
          <Popup>
            <div className="p-2">
              <h3 className="font-semibold text-red-600">Driver Location</h3>
              <p className="text-sm text-gray-600">Your order is on the way!</p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Route Path */}
      {routePath.length > 1 && (
        <Polyline
          positions={routePath}
          pathOptions={{
            color: '#10B981',
            weight: 4,
            opacity: 0.8
          }}
        />
      )}
    </MapContainer>
  )
}

export default function LeafletLocationTracker({
  orderId,
  pickupLocation,
  deliveryLocation,
  driverLocation,
  orderStatus,
  className = 'h-96 w-full rounded-lg overflow-hidden shadow-lg'
}: LocationTrackerProps) {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading map...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <LeafletMap
        pickupLocation={pickupLocation}
        deliveryLocation={deliveryLocation}
        driverLocation={driverLocation}
        orderStatus={orderStatus}
      />
    </div>
  )
}