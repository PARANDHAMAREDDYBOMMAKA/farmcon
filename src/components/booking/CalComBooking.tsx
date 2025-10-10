'use client'

import { useEffect } from 'react'

interface CalComBookingProps {
  /**
   * Your Cal.com username or team slug
   * Example: "your-username" or "your-team/expert-name"
   */
  calLink: string

  /**
   * Additional configuration for the booking widget
   */
  config?: {
    name?: string
    email?: string
    notes?: string
    theme?: 'light' | 'dark' | 'auto'
    layout?: 'month_view' | 'week_view' | 'column_view'
  }

  className?: string
}

/**
 * Cal.com Booking Widget Component
 *
 * FREE TIER: Cal.com is 100% free and open-source
 * - Unlimited bookings
 * - Unlimited event types
 * - Calendar integrations (Google Calendar, Outlook, etc.)
 * - No credit card required
 *
 * Setup:
 * 1. Sign up at https://cal.com (FREE)
 * 2. Create your booking page
 * 3. Get your username (e.g., "john-doe")
 * 4. Use this component with your username
 *
 * Example usage:
 * <CalComBooking calLink="agricultural-expert" />
 */
export default function CalComBooking({
  calLink,
  config = {},
  className = "w-full h-[600px]"
}: CalComBookingProps) {
  useEffect(() => {
    // Load Cal.com embed script
    const script = document.createElement('script')
    script.src = 'https://app.cal.com/embed/embed.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

  // Build data-cal-config from config props
  const calConfig = {
    theme: config.theme || 'auto',
    layout: config.layout || 'month_view',
    ...(config.name && { name: config.name }),
    ...(config.email && { email: config.email }),
    ...(config.notes && { notes: config.notes }),
  }

  return (
    <div className={className}>
      <div
        data-cal-namespace=""
        data-cal-link={calLink}
        data-cal-config={JSON.stringify(calConfig)}
        style={{ width: '100%', height: '100%', overflow: 'auto' }}
      />
    </div>
  )
}
