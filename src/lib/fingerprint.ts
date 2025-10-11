/**
 * Fingerprint.js Integration
 * Device fingerprinting for fraud detection and duplicate account prevention
 *
 * Free Tier: 20,000 identifications/month
 * Use Cases:
 * - Prevent duplicate accounts
 * - Detect fraud and bot activity
 * - Track unique visitors
 * - Session management
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs'

let fpPromise: Promise<any> | null = null

/**
 * Initialize FingerprintJS
 * Only runs once on the client side
 */
export async function initFingerprint() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }

  return fpPromise
}

/**
 * Get visitor ID (device fingerprint)
 * Returns a unique identifier for the device/browser
 */
export async function getVisitorId(): Promise<string | null> {
  try {
    const fp = await initFingerprint()
    if (!fp) return null

    const result = await fp.get()
    return result.visitorId
  } catch (error) {
    console.error('Error getting visitor ID:', error)
    return null
  }
}

/**
 * Get detailed fingerprint data
 * Includes components used to generate the fingerprint
 */
export async function getDetailedFingerprint(): Promise<{
  visitorId: string
  confidence: number
  components: Record<string, any>
} | null> {
  try {
    const fp = await initFingerprint()
    if (!fp) return null

    const result = await fp.get()

    return {
      visitorId: result.visitorId,
      confidence: result.confidence?.score || 0,
      components: result.components
    }
  } catch (error) {
    console.error('Error getting detailed fingerprint:', error)
    return null
  }
}

/**
 * Check if user is likely a bot
 * Based on fingerprint components analysis
 */
export async function isBotLikely(): Promise<boolean> {
  try {
    const fp = await initFingerprint()
    if (!fp) return false

    const result = await fp.get()
    const components = result.components

    // Basic bot detection heuristics
    const botIndicators = [
      // No canvas support (common in headless browsers)
      !components.canvas,
      // No WebGL support
      !components.webgl,
      // Suspicious user agent
      /bot|crawler|spider|crawling/i.test(navigator.userAgent),
      // No touch support on mobile
      /mobile/i.test(navigator.userAgent) && !('ontouchstart' in window),
    ]

    const botScore = botIndicators.filter(Boolean).length
    return botScore >= 2 // If 2 or more indicators, likely a bot
  } catch (error) {
    console.error('Error in bot detection:', error)
    return false
  }
}

/**
 * Track visitor with analytics
 * Combines fingerprint with analytics data
 */
export async function trackVisitor(userId?: string): Promise<void> {
  try {
    const visitorId = await getVisitorId()
    if (!visitorId) return

    // Store in localStorage for quick access
    if (typeof window !== 'undefined') {
      localStorage.setItem('visitor_id', visitorId)
    }

    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.identify(userId || visitorId, {
        device_id: visitorId,
        visitor_id: visitorId,
      })
    }

    console.log('👁️ Visitor tracked:', visitorId)
  } catch (error) {
    console.error('Error tracking visitor:', error)
  }
}
