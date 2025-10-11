'use client'

import { useEffect, useState } from 'react'
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

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

export default function DeliveryMap({ order, className = 'h-96 w-full rounded-lg overflow-hidden shadow-lg' }: DeliveryMapProps) {
  const [currentDriverPosition, setCurrentDriverPosition] = useState<number>(0)
  const [driverLocation, setDriverLocation] = useState<{longitude: number, latitude: number} | null>(null)
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  useEffect(() => {
    if (order.status === 'shipped') {
      simulateDriverMovement()
    }
  }, [order.status])

  const simulateDriverMovement = () => {
    let position = 0
    const totalSteps = 100

    const moveDriver = () => {
      if (position < totalSteps) {
        const segmentLength = totalSteps / (DELIVERY_ROUTE.length - 1)
        const currentSegment = Math.floor(position / segmentLength)
        const segmentProgress = (position % segmentLength) / segmentLength

        if (currentSegment < DELIVERY_ROUTE.length - 1) {
          const start = DELIVERY_ROUTE[currentSegment]
          const end = DELIVERY_ROUTE[currentSegment + 1]

          const latitude = start.lat + (end.lat - start.lat) * segmentProgress
          const longitude = start.lng + (end.lng - start.lng) * segmentProgress

          setDriverLocation({ latitude, longitude })
          setCurrentDriverPosition(currentSegment)
        }

        position += 1
      }
    }

    const interval = setInterval(moveDriver, 5000)
    moveDriver()

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

  if (!mapboxToken) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <p className="text-gray-600">Map configuration required</p>
      </div>
    )
  }

  // Create GeoJSON for the route line
  const routeGeoJSON = {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: DELIVERY_ROUTE.map(loc => [loc.lng, loc.lat])
    },
    properties: {}
  }

  // Progress line for shipped orders
  const progressGeoJSON = order.status === 'shipped' && driverLocation ? {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [DELIVERY_ROUTE[0].lng, DELIVERY_ROUTE[0].lat],
        [driverLocation.longitude, driverLocation.latitude]
      ]
    },
    properties: {}
  } : null

  return (
    <div className={className}>
      <Map
        initialViewState={{
          latitude: 15.5,
          longitude: 78.9,
          zoom: 7
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
      >
        {/* Route line */}
        <Source id="route" type="geojson" data={routeGeoJSON}>
          <Layer
            id="route-layer"
            type="line"
            paint={{
              'line-color': order.status === 'delivered' ? '#10B981' : '#3B82F6',
              'line-width': 4,
              'line-opacity': 0.8
            }}
          />
        </Source>

        {/* Progress line for shipped orders */}
        {progressGeoJSON && (
          <Source id="progress" type="geojson" data={progressGeoJSON}>
            <Layer
              id="progress-layer"
              type="line"
              paint={{
                'line-color': '#10B981',
                'line-width': 6,
                'line-opacity': 1
              }}
            />
          </Source>
        )}

        {/* Route waypoint markers */}
        {DELIVERY_ROUTE.map((location, index) => {
          const isCompleted = order.status === 'delivered' ||
                             (order.status === 'shipped' && currentDriverPosition > index)
          const isCurrent = order.status === 'shipped' && currentDriverPosition === index

          return (
            <Marker
              key={index}
              latitude={location.lat}
              longitude={location.lng}
            >
              <div
                className="flex items-center justify-center w-8 h-8 rounded-full border-2 border-white shadow-lg cursor-pointer"
                style={{
                  backgroundColor: isCompleted ? '#10B981' : isCurrent ? '#3B82F6' : '#9CA3AF'
                }}
                onClick={() => setSelectedMarker(index)}
              >
                <span className="text-white text-sm font-bold">{index + 1}</span>
              </div>
            </Marker>
          )
        })}

        {/* Moving driver marker for shipped orders */}
        {order.status === 'shipped' && driverLocation && (
          <Marker
            latitude={driverLocation.latitude}
            longitude={driverLocation.longitude}
          >
            <div
              className="text-3xl animate-bounce cursor-pointer"
              onClick={() => setSelectedMarker(-1)}
            >
              🚚
            </div>
          </Marker>
        )}

        {/* Popups */}
        {selectedMarker !== null && selectedMarker >= 0 && selectedMarker < DELIVERY_ROUTE.length && (
          <Popup
            latitude={DELIVERY_ROUTE[selectedMarker].lat}
            longitude={DELIVERY_ROUTE[selectedMarker].lng}
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2 min-w-[200px]">
              <h3 className="font-semibold text-green-600">{DELIVERY_ROUTE[selectedMarker].name}</h3>
              <p className="text-sm text-gray-600">{DELIVERY_ROUTE[selectedMarker].address}</p>
              {selectedMarker === 0 && <p className="text-xs text-green-600 mt-1">📦 Origin</p>}
              {selectedMarker === DELIVERY_ROUTE.length - 1 && (
                <p className="text-xs text-blue-600 mt-1">📍 {parseDeliveryAddress()}</p>
              )}
            </div>
          </Popup>
        )}

        {selectedMarker === -1 && driverLocation && (
          <Popup
            latitude={driverLocation.latitude}
            longitude={driverLocation.longitude}
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
          >
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
        )}
      </Map>
    </div>
  )
}
