'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

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

const createCustomMarkerIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        width: 40px;
        height: 40px;
        background-color: ${color};
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        color: white;
        font-weight: bold;
        font-size: 18px;
      ">
        ${label}
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 20],
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

function FitBounds({ pickupLocation, deliveryLocation }: { pickupLocation?: any; deliveryLocation?: any }) {
  const map = useMap()

  useEffect(() => {
    if (pickupLocation && deliveryLocation) {
      const bounds = L.latLngBounds(
        [pickupLocation.lat, pickupLocation.lng],
        [deliveryLocation.lat, deliveryLocation.lng]
      )
      map.fitBounds(bounds, { padding: [50, 50] })
    }
  }, [map, pickupLocation, deliveryLocation])

  return null
}

export default function LeafletLocationTracker({
  orderId,
  pickupLocation,
  deliveryLocation,
  driverLocation,
  orderStatus,
  className = 'h-96 w-full rounded-lg overflow-hidden shadow-lg'
}: LocationTrackerProps) {
  const [selectedMarker, setSelectedMarker] = useState<'pickup' | 'delivery' | 'driver' | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const getMapCenter = (): [number, number] => {
    if (pickupLocation && deliveryLocation) {
      return [
        (pickupLocation.lat + deliveryLocation.lat) / 2,
        (pickupLocation.lng + deliveryLocation.lng) / 2
      ]
    }
    if (pickupLocation) return [pickupLocation.lat, pickupLocation.lng]
    if (deliveryLocation) return [deliveryLocation.lat, deliveryLocation.lng]
    return [20.5937, 78.9629] 
  }

  const mapCenter = getMapCenter()

  const routeCoordinates: [number, number][] = []
  if (pickupLocation && deliveryLocation && orderStatus !== 'pending') {
    routeCoordinates.push([pickupLocation.lat, pickupLocation.lng])
    if (driverLocation && orderStatus === 'shipped') {
      routeCoordinates.push([driverLocation.lat, driverLocation.lng])
    }
    routeCoordinates.push([deliveryLocation.lat, deliveryLocation.lng])
  }

  if (!isMounted) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <p className="text-gray-900">Loading map...</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <MapContainer
        center={mapCenter}
        zoom={10}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds pickupLocation={pickupLocation} deliveryLocation={deliveryLocation} />

        {}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            color="#10B981"
            weight={4}
            opacity={0.8}
          />
        )}

        {}
        {pickupLocation && (
          <Marker
            position={[pickupLocation.lat, pickupLocation.lng]}
            icon={createCustomMarkerIcon('#10B981', 'P')}
            eventHandlers={{
              click: () => setSelectedMarker('pickup')
            }}
          >
            {selectedMarker === 'pickup' && (
              <Popup onClose={() => setSelectedMarker(null)}>
                <div className="p-2">
                  <h3 className="font-semibold text-green-600">Pickup Location</h3>
                  <p className="text-sm text-gray-900">{pickupLocation.address}</p>
                </div>
              </Popup>
            )}
          </Marker>
        )}

        {}
        {deliveryLocation && (
          <Marker
            position={[deliveryLocation.lat, deliveryLocation.lng]}
            icon={createCustomMarkerIcon('#3B82F6', 'D')}
            eventHandlers={{
              click: () => setSelectedMarker('delivery')
            }}
          >
            {selectedMarker === 'delivery' && (
              <Popup onClose={() => setSelectedMarker(null)}>
                <div className="p-2">
                  <h3 className="font-semibold text-blue-600">Delivery Location</h3>
                  <p className="text-sm text-gray-900">{deliveryLocation.address}</p>
                </div>
              </Popup>
            )}
          </Marker>
        )}

        {}
        {driverLocation && orderStatus === 'shipped' && (
          <Marker
            position={[driverLocation.lat, driverLocation.lng]}
            icon={driverIcon}
            eventHandlers={{
              click: () => setSelectedMarker('driver')
            }}
          >
            {selectedMarker === 'driver' && (
              <Popup onClose={() => setSelectedMarker(null)}>
                <div className="p-2">
                  <h3 className="font-semibold text-red-600">Driver Location</h3>
                  <p className="text-sm text-gray-900">Your order is on the way!</p>
                </div>
              </Popup>
            )}
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
