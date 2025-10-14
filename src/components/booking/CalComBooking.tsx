'use client'

import { useEffect } from 'react'

interface CalComBookingProps {
  
  calLink: string

  config?: {
    name?: string
    email?: string
    notes?: string
    theme?: 'light' | 'dark' | 'auto'
    layout?: 'month_view' | 'week_view' | 'column_view'
  }

  className?: string
}

export default function CalComBooking({
  calLink,
  config = {},
  className = "w-full h-[600px]"
}: CalComBookingProps) {
  useEffect(() => {
    
    const script = document.createElement('script')
    script.src = 'https://app.cal.com/embed/embed.js'
    script.async = true
    document.body.appendChild(script)

    return () => {
      
      if (document.body.contains(script)) {
        document.body.removeChild(script)
      }
    }
  }, [])

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
