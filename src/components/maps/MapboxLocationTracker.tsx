'use client'

import { useState } from 'react'
import Map, { Marker, Popup, Source, Layer } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

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

export default function MapboxLocationTracker({
  orderId,
  pickupLocation,
  deliveryLocation,
  driverLocation,
  orderStatus,
  className = 'h-96 w-full rounded-lg overflow-hidden shadow-lg'
}: LocationTrackerProps) {
  const [selectedMarker, setSelectedMarker] = useState<'pickup' | 'delivery' | 'driver' | null>(null)

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  if (!mapboxToken) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <p className="text-gray-600">Map configuration required</p>
      </div>
    )
  }

  // Determine map center
  const getMapCenter = (): { latitude: number; longitude: number } => {
    if (pickupLocation && deliveryLocation) {
      return {
        latitude: (pickupLocation.lat + deliveryLocation.lat) / 2,
        longitude: (pickupLocation.lng + deliveryLocation.lng) / 2
      }
    }
    if (pickupLocation) return { latitude: pickupLocation.lat, longitude: pickupLocation.lng }
    if (deliveryLocation) return { latitude: deliveryLocation.lat, longitude: deliveryLocation.lng }
    return { latitude: 20.5937, longitude: 78.9629 }
  }

  const mapCenter = getMapCenter()

  // Create route GeoJSON
  const routeGeoJSON = pickupLocation && deliveryLocation && orderStatus !== 'pending' ? {
    type: 'Feature' as const,
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [pickupLocation.lng, pickupLocation.lat],
        ...(driverLocation && orderStatus === 'shipped' ? [[driverLocation.lng, driverLocation.lat]] : []),
        [deliveryLocation.lng, deliveryLocation.lat]
      ]
    },
    properties: {}
  } : null

  return (
    <div className={className}>
      <Map
        initialViewState={{
          ...mapCenter,
          zoom: 10
        }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
      >
        {/* Route line */}
        {routeGeoJSON && (
          <Source id="route" type="geojson" data={routeGeoJSON}>
            <Layer
              id="route-layer"
              type="line"
              paint={{
                'line-color': '#10B981',
                'line-width': 4,
                'line-opacity': 0.8
              }}
            />
          </Source>
        )}

        {/* Pickup Location Marker */}
        {pickupLocation && (
          <Marker
            latitude={pickupLocation.lat}
            longitude={pickupLocation.lng}
          >
            <div
              className="flex items-center justify-center w-10 h-10 bg-green-500 rounded-full border-2 border-white shadow-lg cursor-pointer"
              onClick={() => setSelectedMarker('pickup')}
            >
              <span className="text-white font-bold text-lg">P</span>
            </div>
          </Marker>
        )}

        {/* Delivery Location Marker */}
        {deliveryLocation && (
          <Marker
            latitude={deliveryLocation.lat}
            longitude={deliveryLocation.lng}
          >
            <div
              className="flex items-center justify-center w-10 h-10 bg-blue-500 rounded-full border-2 border-white shadow-lg cursor-pointer"
              onClick={() => setSelectedMarker('delivery')}
            >
              <span className="text-white font-bold text-lg">D</span>
            </div>
          </Marker>
        )}

        {/* Driver Location Marker */}
        {driverLocation && orderStatus === 'shipped' && (
          <Marker
            latitude={driverLocation.lat}
            longitude={driverLocation.lng}
          >
            <div
              className="text-3xl animate-bounce cursor-pointer"
              onClick={() => setSelectedMarker('driver')}
            >
              🚚
            </div>
          </Marker>
        )}

        {/* Popups */}
        {selectedMarker === 'pickup' && pickupLocation && (
          <Popup
            latitude={pickupLocation.lat}
            longitude={pickupLocation.lng}
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="font-semibold text-green-600">Pickup Location</h3>
              <p className="text-sm text-gray-600">{pickupLocation.address}</p>
            </div>
          </Popup>
        )}

        {selectedMarker === 'delivery' && deliveryLocation && (
          <Popup
            latitude={deliveryLocation.lat}
            longitude={deliveryLocation.lng}
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="font-semibold text-blue-600">Delivery Location</h3>
              <p className="text-sm text-gray-600">{deliveryLocation.address}</p>
            </div>
          </Popup>
        )}

        {selectedMarker === 'driver' && driverLocation && (
          <Popup
            latitude={driverLocation.lat}
            longitude={driverLocation.lng}
            onClose={() => setSelectedMarker(null)}
            closeButton={true}
            closeOnClick={false}
          >
            <div className="p-2">
              <h3 className="font-semibold text-red-600">Driver Location</h3>
              <p className="text-sm text-gray-600">Your order is on the way!</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
