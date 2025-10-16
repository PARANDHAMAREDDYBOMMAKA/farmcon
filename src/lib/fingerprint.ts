import FingerprintJS, { Agent, GetResult } from '@fingerprintjs/fingerprintjs'

// Singleton instance to prevent multiple initializations
let fpPromise: Promise<Agent> | null = null

/**
 * Initialize FingerprintJS library
 * Uses singleton pattern to ensure only one instance
 * @returns Promise resolving to FingerprintJS agent or null if not in browser
 */
export async function initFingerprint(): Promise<Agent | null> {
  // SSR safety check
  if (typeof window === 'undefined') {
    return null
  }

  // Return existing promise if already initialized
  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }

  try {
    return await fpPromise
  } catch (error) {
    console.error('Failed to load FingerprintJS:', error)
    // Reset promise so it can be retried
    fpPromise = null
    return null
  }
}

/**
 * Get unique visitor ID
 * @returns Visitor ID string or null if failed
 */
export async function getVisitorId(): Promise<string | null> {
  try {
    const fp = await initFingerprint()
    if (!fp) return null

    const result: GetResult = await fp.get()
    return result.visitorId
  } catch (error) {
    console.error('Error getting visitor ID:', error)
    return null
  }
}

export interface DetailedFingerprint {
  visitorId: string
  confidence: number
  components: Record<string, any>
}

/**
 * Get detailed fingerprint information including components
 * @returns Detailed fingerprint object or null if failed
 */
export async function getDetailedFingerprint(): Promise<DetailedFingerprint | null> {
  try {
    const fp = await initFingerprint()
    if (!fp) return null

    const result: GetResult = await fp.get()

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
 * Detect if visitor is likely a bot
 * Uses multiple heuristics to determine bot likelihood
 * @returns true if visitor appears to be a bot, false otherwise
 */
export async function isBotLikely(): Promise<boolean> {
  try {
    const fp = await initFingerprint()
    if (!fp) return false

    const result: GetResult = await fp.get()
    const components = result.components as any

    // Multiple bot indicators
    const botIndicators = [
      // Missing canvas support (common in headless browsers)
      !components.canvas || (components.canvas.error !== undefined),
      // User agent matches bot pattern
      typeof navigator !== 'undefined' && /bot|crawler|spider|crawling|headless/i.test(navigator.userAgent),
      // Mobile UA without touch support (suspicious)
      typeof navigator !== 'undefined' && typeof window !== 'undefined' &&
        /mobile/i.test(navigator.userAgent) && !('ontouchstart' in window),
    ]

    const botScore = botIndicators.filter(Boolean).length
    // Consider bot if 2 or more indicators present
    return botScore >= 2
  } catch (error) {
    console.error('Error in bot detection:', error)
    // Fail open - don't block on error
    return false
  }
}

/**
 * Track visitor with optional user ID
 * Stores visitor ID in localStorage and integrates with PostHog
 * @param userId Optional user ID to associate with the visitor
 */
export async function trackVisitor(userId?: string): Promise<void> {
  try {
    const visitorId = await getVisitorId()
    if (!visitorId) {
      console.warn('Unable to get visitor ID for tracking')
      return
    }

    // Store in localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('visitor_id', visitorId)

      // Store timestamp of when fingerprint was created
      localStorage.setItem('visitor_id_timestamp', new Date().toISOString())
    }

    // Integrate with PostHog analytics if available
    if (typeof window !== 'undefined' && (window as any).posthog) {
      const posthog = (window as any).posthog

      posthog.identify(userId || visitorId, {
        device_fingerprint: visitorId,
        fingerprint_timestamp: new Date().toISOString(),
      })

      // Set as super property for all future events
      posthog.register({
        device_fingerprint: visitorId,
      })
    }

    console.log('Visitor tracked successfully:', visitorId.substring(0, 8) + '...')
  } catch (error) {
    console.error('Error tracking visitor:', error)
  }
}

/**
 * Get stored visitor ID from localStorage
 * @returns Stored visitor ID or null if not found
 */
export function getStoredVisitorId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('visitor_id')
}

/**
 * Clear stored visitor ID from localStorage
 * Useful for testing or privacy compliance
 */
export function clearStoredVisitorId(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('visitor_id')
  localStorage.removeItem('visitor_id_timestamp')
}
