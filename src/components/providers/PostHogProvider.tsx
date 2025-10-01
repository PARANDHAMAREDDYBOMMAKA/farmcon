'use client'

import { useEffect, Suspense } from 'react'
import posthog from 'posthog-js'
import { usePathname, useSearchParams } from 'next/navigation'

// Initialize PostHog immediately (outside component)
if (typeof window !== 'undefined') {
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified_only',
      capture_pageview: true, // Auto-capture pageviews
      capture_pageleave: true,
      autocapture: true,
      loaded: (posthog) => {
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ PostHog initialized successfully')
          console.log('PostHog instance:', posthog)
        }
      },
    })
  }
}

function PostHogPageView() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Track pageviews manually for better control
  useEffect(() => {
    if (pathname) {
      let url = window.origin + pathname
      if (searchParams && searchParams.toString()) {
        url = url + `?${searchParams.toString()}`
      }

      // Capture pageview event
      posthog.capture('$pageview', {
        $current_url: url,
      })

      // Also identify the page
      posthog.capture('page_viewed', {
        page: pathname,
        url: url,
      })

      if (process.env.NODE_ENV === 'development') {
        console.log('📊 PostHog pageview:', pathname)
      }
    }
  }, [pathname, searchParams])

  return null
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </>
  )
}
