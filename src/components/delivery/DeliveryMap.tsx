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

interface DeliveryMapProps {
  order: {
    id: string
    status: string
    shipping_address: any
  }
  className?: string
}

interface Location {
  lat: number
  lng: number
  name: string
  address: string
}

// Delivery route waypoints
const DELIVERY_ROUTE: Location[] = [
  {
    lat: 17.3850,
    lng: 78.4867,
    name: "FarmCon Warehouse",
    address: "Hyderabad, Telangana"
  },
  {
    lat: 16.9251,
    lng: 78.9267,
    name: "Sorting Facility",
    address: "Vijayawada, Andhra Pradesh"
  },
  {
    lat: 13.6288,
    lng: 79.4192,
    name: "Distribution Center",
    address: "Tirupati, Andhra Pradesh"
  },
  {
    lat: 13.6168,
    lng: 79.5460,
    name: "Delivery Location",
    address: "Kalakada, Andhra Pradesh"
  }
]

// Custom icons for different marker types
const createIcon = (color: string, symbol: string, size: number = 32) => {
  if (typeof window === 'undefined') return undefined

  return new Icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${size/2}" cy="${size/2}" r="${size/2 - 2}" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="${size/2}" y="${size/2 + 4}" text-anchor="middle" fill="white" font-size="${size/3}" font-weight="bold">${symbol}</text>
      </svg>
    `)}`,
    iconSize: [size, size],
    iconAnchor: [size/2, size],
    popupAnchor: [0, -size]
  })
}

export default function DeliveryMap({ order, className = 'h-96 w-full rounded-lg overflow-hidden shadow-lg' }: DeliveryMapProps) {
  const [isClient, setIsClient] = useState(false)
  const [currentDriverPosition, setCurrentDriverPosition] = useState<number>(0)
  const [driverLocation, setDriverLocation] = useState<LatLngExpression | null>(null)

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

  useEffect(() => {
    if (order.status === 'shipped') {
      simulateDriverMovement()
    }
  }, [order.status])

  const simulateDriverMovement = () => {
    let position = 0
    const totalSteps = 100 // Number of animation steps

    const moveDriver = () => {
      if (position < totalSteps) {
        // Calculate position along the route
        const segmentLength = totalSteps / (DELIVERY_ROUTE.length - 1)
        const currentSegment = Math.floor(position / segmentLength)
        const segmentProgress = (position % segmentLength) / segmentLength

        if (currentSegment < DELIVERY_ROUTE.length - 1) {
          const start = DELIVERY_ROUTE[currentSegment]
          const end = DELIVERY_ROUTE[currentSegment + 1]

          const lat = start.lat + (end.lat - start.lat) * segmentProgress
          const lng = start.lng + (end.lng - start.lng) * segmentProgress

          setDriverLocation([lat, lng])
          setCurrentDriverPosition(currentSegment)
        }

        position += 1
      }
    }

    // Move driver every 5 seconds
    const interval = setInterval(moveDriver, 5000)
    moveDriver() // Initial position

    return () => clearInterval(interval)
  }

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

  if (!isClient) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading delivery map...</p>
        </div>
      </div>
    )
  }

  // Map center - show the entire route
  const mapCenter: LatLngExpression = [15.5, 78.9] // Centered between Hyderabad and Kalakada

  return (
    <div className={className}>
      <MapContainer
        center={mapCenter}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Route waypoints */}
        {DELIVERY_ROUTE.map((location, index) => {
          const isCompleted = order.status === 'delivered' ||
                             (order.status === 'shipped' && currentDriverPosition > index)
          const isCurrent = order.status === 'shipped' && currentDriverPosition === index

          return (
            <Marker
              key={index}
              position={[location.lat, location.lng]}
              icon={createIcon(
                isCompleted ? '#10B981' : isCurrent ? '#3B82F6' : '#9CA3AF',
                (index + 1).toString()
              )}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className={`font-semibold ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-600'}`}>
                    {location.name}
                  </h3>
                  <p className="text-sm text-gray-600">{location.address}</p>
                  {index === 0 && <p className="text-xs text-green-600 mt-1">📦 Origin</p>}
                  {index === DELIVERY_ROUTE.length - 1 && (
                    <p className="text-xs text-blue-600 mt-1">📍 {parseDeliveryAddress()}</p>
                  )}
                  {isCompleted && <p className="text-xs text-green-600 mt-1">✅ Completed</p>}
                  {isCurrent && <p className="text-xs text-blue-600 mt-1">🚛 Current Location</p>}
                </div>
              </Popup>
            </Marker>
          )
        })}

        {/* Moving driver marker for shipped orders */}
        {order.status === 'shipped' && driverLocation && (
          <Marker
            position={driverLocation}
            icon={createIcon('#EF4444', '🚚', 40)}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-red-600">Delivery Vehicle</h3>
                <p className="text-sm text-gray-600">Your order is on the way!</p>
                <div className="mt-2 space-y-1 text-xs">
                  <p className="text-green-600">📦 Order #{order.id.slice(-8)}</p>
                  <p className="text-blue-600">📍 Moving towards delivery location</p>
                  <p className="text-gray-500">⏱️ Live tracking active</p>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route line */}
        <Polyline
          positions={DELIVERY_ROUTE.map(loc => [loc.lat, loc.lng] as LatLngExpression)}
          pathOptions={{
            color: order.status === 'delivered' ? '#10B981' : '#3B82F6',
            weight: 4,
            opacity: 0.8,
            dashArray: order.status === 'shipped' ? '10, 5' : undefined
          }}
        />

        {/* Progress line for shipped orders */}
        {order.status === 'shipped' && driverLocation && (
          <Polyline
            positions={[
              [DELIVERY_ROUTE[0].lat, DELIVERY_ROUTE[0].lng],
              driverLocation
            ]}
            pathOptions={{
              color: '#10B981',
              weight: 6,
              opacity: 1
            }}
          />
        )}
      </MapContainer>
    </div>
  )
}