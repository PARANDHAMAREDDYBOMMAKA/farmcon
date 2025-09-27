'use client'

import { useEffect, useState } from 'react'
import { Wrapper, Status } from '@googlemaps/react-wrapper'

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

function MapComponent({ 
  pickupLocation, 
  deliveryLocation, 
  driverLocation, 
  orderStatus 
}: Omit<LocationTrackerProps, 'orderId' | 'className'>) {
  const [map, setMap] = useState<google.maps.Map>()
  const [markers, setMarkers] = useState<google.maps.Marker[]>([])

  useEffect(() => {
    if (!map) return

    // Clear existing markers
    markers.forEach(marker => marker.setMap(null))
    const newMarkers: google.maps.Marker[] = []

    // Add pickup location marker (green)
    if (pickupLocation) {
      const pickupMarker = new google.maps.Marker({
        position: pickupLocation,
        map,
        title: 'Pickup Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#10B981"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32)
        }
      })

      const pickupInfoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-green-600">Pickup Location</h3>
            <p class="text-sm text-gray-600">${pickupLocation.address}</p>
          </div>
        `
      })

      pickupMarker.addListener('click', () => {
        pickupInfoWindow.open(map, pickupMarker)
      })

      newMarkers.push(pickupMarker)
    }

    // Add delivery location marker (blue)
    if (deliveryLocation) {
      const deliveryMarker = new google.maps.Marker({
        position: deliveryLocation,
        map,
        title: 'Delivery Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="#3B82F6"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32)
        }
      })

      const deliveryInfoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-blue-600">Delivery Location</h3>
            <p class="text-sm text-gray-600">${deliveryLocation.address}</p>
          </div>
        `
      })

      deliveryMarker.addListener('click', () => {
        deliveryInfoWindow.open(map, deliveryMarker)
      })

      newMarkers.push(deliveryMarker)
    }

    // Add driver location marker (red, only if order is shipped)
    if (driverLocation && orderStatus === 'shipped') {
      const driverMarker = new google.maps.Marker({
        position: driverLocation,
        map,
        title: 'Driver Location',
        icon: {
          url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0-1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z" fill="#EF4444"/>
            </svg>
          `),
          scaledSize: new google.maps.Size(32, 32)
        }
      })

      const driverInfoWindow = new google.maps.InfoWindow({
        content: `
          <div class="p-2">
            <h3 class="font-semibold text-red-600">Driver Location</h3>
            <p class="text-sm text-gray-600">Your order is on the way!</p>
          </div>
        `
      })

      driverMarker.addListener('click', () => {
        driverInfoWindow.open(map, driverMarker)
      })

      newMarkers.push(driverMarker)
    }

    // Draw route if both pickup and delivery locations are available
    if (pickupLocation && deliveryLocation && orderStatus !== 'pending') {
      const directionsService = new google.maps.DirectionsService()
      const directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: '#10B981',
          strokeWeight: 4,
          strokeOpacity: 0.8
        }
      })

      directionsRenderer.setMap(map)

      directionsService.route({
        origin: pickupLocation,
        destination: deliveryLocation,
        travelMode: google.maps.TravelMode.DRIVING
      }, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          directionsRenderer.setDirections(result)
        }
      })
    }

    setMarkers(newMarkers)

    // Adjust map bounds to show all markers
    if (newMarkers.length > 0) {
      const bounds = new google.maps.LatLngBounds()
      newMarkers.forEach(marker => {
        if (marker.getPosition()) {
          bounds.extend(marker.getPosition()!)
        }
      })
      map.fitBounds(bounds)

      // Ensure minimum zoom level
      const listener = google.maps.event.addListener(map, 'idle', () => {
        if (map.getZoom()! > 15) map.setZoom(15)
        google.maps.event.removeListener(listener)
      })
    }
  }, [map, pickupLocation, deliveryLocation, driverLocation, orderStatus])

  const ref = (node: HTMLDivElement | null) => {
    if (node && !map) {
      const newMap = new google.maps.Map(node, {
        center: pickupLocation || deliveryLocation || { lat: 20.5937, lng: 78.9629 }, // India center
        zoom: 10,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false
      })
      setMap(newMap)
    }
  }

  return <div ref={ref} style={{ width: '100%', height: '100%' }} />
}

const renderStatus = (status: Status) => {
  switch (status) {
    case Status.LOADING:
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Loading map...</span>
        </div>
      )
    case Status.FAILURE:
      return (
        <div className="flex items-center justify-center h-full text-red-600">
          <span>❌ Error loading map. Please check your internet connection.</span>
        </div>
      )
    default:
      return null
  }
}

export default function LocationTracker({
  orderId,
  pickupLocation,
  deliveryLocation,
  driverLocation,
  orderStatus,
  className = 'h-96 w-full rounded-lg overflow-hidden shadow-lg'
}: LocationTrackerProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100`}>
        <div className="text-center">
          <span className="text-2xl">🗺️</span>
          <p className="text-gray-600 mt-2">Map unavailable</p>
          <p className="text-sm text-gray-500">Google Maps API key not configured</p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <Wrapper apiKey={apiKey} render={renderStatus}>
        <MapComponent
          pickupLocation={pickupLocation}
          deliveryLocation={deliveryLocation}
          driverLocation={driverLocation}
          orderStatus={orderStatus}
        />
      </Wrapper>
    </div>
  )
}