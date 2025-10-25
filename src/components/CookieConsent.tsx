'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Cookie, X } from 'lucide-react'

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consentGiven = localStorage.getItem('cookieConsent')
    if (!consentGiven) {
      // Show banner after a short delay for better UX
      setTimeout(() => {
        setShowConsent(true)
        setTimeout(() => setIsVisible(true), 100)
      }, 1000)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('cookieConsent', 'accepted')
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    closeConsent()
  }

  const handleDecline = () => {
    localStorage.setItem('cookieConsent', 'declined')
    localStorage.setItem('cookieConsentDate', new Date().toISOString())
    closeConsent()
  }

  const closeConsent = () => {
    setIsVisible(false)
    setTimeout(() => setShowConsent(false), 300)
  }

  if (!showConsent) return null

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-[100] transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Gradient accent bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600"></div>

          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {/* Icon */}
              <div className="flex-shrink-0">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <Cookie className="w-7 h-7 text-green-600" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                  We value your privacy
                </h3>
                <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                  We use cookies to enhance your browsing experience, analyze site traffic, and provide personalized content.
                  By clicking &quot;Accept&quot;, you consent to our use of cookies. Learn more in our{' '}
                  <Link href="/cookie-policy" className="text-green-600 hover:text-green-700 font-medium underline">
                    Cookie Policy
                  </Link>
                  {' '}and{' '}
                  <Link href="/privacy-policy" className="text-green-600 hover:text-green-700 font-medium underline">
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>

              {/* Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:flex-shrink-0">
                <button
                  onClick={handleDecline}
                  className="px-6 py-3 rounded-full border-2 border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 text-sm sm:text-base whitespace-nowrap"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="px-6 py-3 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:shadow-lg hover:scale-105 transition-all duration-200 text-sm sm:text-base whitespace-nowrap"
                >
                  Accept Cookies
                </button>
              </div>

              {/* Close button (mobile) */}
              <button
                onClick={handleDecline}
                className="absolute top-4 right-4 sm:hidden p-2 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
