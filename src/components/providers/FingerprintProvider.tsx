'use client'

import { useEffect, useState } from 'react'
import { initFingerprint, getVisitorId } from '@/lib/fingerprint'

declare global {
  interface Window {
    posthog?: any
  }
}

export default function FingerprintProvider({
  children
}: {
  children: React.ReactNode
}) {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    let mounted = true

    async function setupFingerprint() {
      try {
        // Initialize FingerprintJS
        await initFingerprint()

        if (!mounted) return

        // Get visitor ID
        const visitorId = await getVisitorId()

        if (!mounted || !visitorId) return

        // Store in localStorage for persistence
        localStorage.setItem('visitor_id', visitorId)

        // Integrate with PostHog if available
        if (window.posthog) {
          // Set visitor ID as distinct_id
          window.posthog.identify(visitorId, {
            device_fingerprint: visitorId,
            fingerprint_source: 'fingerprintjs',
          })

          // Set as super property for all future events
          window.posthog.register({
            device_fingerprint: visitorId,
          })

          console.log('Fingerprint initialized and integrated with PostHog:', visitorId)
        } else {
          console.log('Fingerprint initialized:', visitorId)
        }

        setInitialized(true)
      } catch (error) {
        console.error('Failed to initialize fingerprint:', error)
        // Don't block the app if fingerprinting fails
        setInitialized(true)
      }
    }

    // Delay initialization slightly to not block initial render
    const timer = setTimeout(setupFingerprint, 1000)

    return () => {
      mounted = false
      clearTimeout(timer)
    }
  }, [])

  // Don't block rendering - fingerprinting happens in background
  return <>{children}</>
}
