'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default marker icons in production
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

interface LeafletMapProps {
  latitude?: number
  longitude?: number
  zoom?: number
  height?: string
  markers?: Array<{
    latitude: number
    longitude: number
    label?: string
    color?: string
  }>
  onLocationSelect?: (lat: number, lng: number) => void
}

// Component to handle map clicks
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (lat: number, lng: number) => void }) {
  const map = useMap()

  useEffect(() => {
    if (!onLocationSelect) return

    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    }

    map.on('click', handleClick)
    return () => {
      map.off('click', handleClick)
    }
  }, [map, onLocationSelect])

  return null
}

// Component to update map view
function MapViewController({ latitude, longitude, zoom }: { latitude: number; longitude: number; zoom: number }) {
  const map = useMap()

  useEffect(() => {
    map.setView([latitude, longitude], zoom)
  }, [map, latitude, longitude, zoom])

  return null
}

// Custom colored marker icon
const createColoredIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 25px; height: 41px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  })
}

export default function LeafletMap({
  latitude = 28.6139, // Default: New Delhi
  longitude = 77.209,
  zoom = 10,
  height = '400px',
  markers = [],
  onLocationSelect,
}: LeafletMapProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div
        className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-600 dark:text-gray-400">Loading map...</p>
      </div>
    )
  }

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden z-0">
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapClickHandler onLocationSelect={onLocationSelect} />
        <MapViewController latitude={latitude} longitude={longitude} zoom={zoom} />

        {/* Markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.latitude, marker.longitude]}
            icon={marker.color ? createColoredIcon(marker.color) : undefined}
          >
            {marker.label && (
              <Popup>
                <div className="bg-white px-2 py-1 rounded shadow-lg text-sm">
                  {marker.label}
                </div>
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}

// Satellite Map Component
export function SatelliteMap({
  latitude = 28.6139,
  longitude = 77.209,
  zoom = 15,
  height = '400px',
}: Omit<LeafletMapProps, 'markers' | 'onLocationSelect'>) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) {
    return (
      <div
        className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-600 dark:text-gray-400">Loading satellite map...</p>
      </div>
    )
  }

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden z-0">
      <MapContainer
        center={[latitude, longitude]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
      >
        {/* Using Esri World Imagery for satellite view */}
        <TileLayer
          attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />

        <MapViewController latitude={latitude} longitude={longitude} zoom={zoom} />
      </MapContainer>
    </div>
  )
}
