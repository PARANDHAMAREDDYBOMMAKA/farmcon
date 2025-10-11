'use client'

import { useState, useCallback } from 'react'
import Map, { Marker, NavigationControl, GeolocateControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'

interface MapboxMapProps {
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

export default function MapboxMap({
  latitude = 28.6139, // Default: New Delhi
  longitude = 77.209,
  zoom = 10,
  height = '400px',
  markers = [],
  onLocationSelect,
}: MapboxMapProps) {
  const [viewState, setViewState] = useState({
    latitude,
    longitude,
    zoom,
  })

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  const handleMapClick = useCallback(
    (event: any) => {
      if (onLocationSelect && event.lngLat) {
        onLocationSelect(event.lngLat.lat, event.lngLat.lng)
      }
    },
    [onLocationSelect]
  )

  if (!mapboxToken) {
    return (
      <div
        className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-600 dark:text-gray-400">
          Mapbox token not configured. Please add NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN to .env
        </p>
      </div>
    )
  }

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        mapboxAccessToken={mapboxToken}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />

        {/* Geolocate Control */}
        <GeolocateControl
          position="top-right"
          trackUserLocation
          onGeolocate={(e) => {
            if (onLocationSelect) {
              onLocationSelect(e.coords.latitude, e.coords.longitude)
            }
          }}
        />

        {/* Markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            latitude={marker.latitude}
            longitude={marker.longitude}
            color={marker.color || '#10b981'}
          >
            {marker.label && (
              <div className="bg-white px-2 py-1 rounded shadow-lg text-sm">
                {marker.label}
              </div>
            )}
          </Marker>
        ))}
      </Map>
    </div>
  )
}

// Satellite Map Component
export function SatelliteMap({
  latitude = 28.6139,
  longitude = 77.209,
  zoom = 15,
  height = '400px',
}: Omit<MapboxMapProps, 'markers' | 'onLocationSelect'>) {
  const [viewState, setViewState] = useState({
    latitude,
    longitude,
    zoom,
  })

  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN

  if (!mapboxToken) {
    return (
      <div
        className="flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-lg"
        style={{ height }}
      >
        <p className="text-gray-600 dark:text-gray-400">Mapbox token not configured</p>
      </div>
    )
  }

  return (
    <div style={{ height }} className="rounded-lg overflow-hidden">
      <Map
        {...viewState}
        onMove={(evt) => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={mapboxToken}
      >
        <NavigationControl position="top-right" />
      </Map>
    </div>
  )
}
