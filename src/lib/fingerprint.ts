

import FingerprintJS from '@fingerprintjs/fingerprintjs'

let fpPromise: Promise<any> | null = null

export async function initFingerprint() {
  if (typeof window === 'undefined') {
    return null
  }

  if (!fpPromise) {
    fpPromise = FingerprintJS.load()
  }

  return fpPromise
}

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

export async function isBotLikely(): Promise<boolean> {
  try {
    const fp = await initFingerprint()
    if (!fp) return false

    const result = await fp.get()
    const components = result.components

    const botIndicators = [
      
      !components.canvas,
      
      !components.webgl,
      
      /bot|crawler|spider|crawling/i.test(navigator.userAgent),
      
      /mobile/i.test(navigator.userAgent) && !('ontouchstart' in window),
    ]

    const botScore = botIndicators.filter(Boolean).length
    return botScore >= 2 
  } catch (error) {
    console.error('Error in bot detection:', error)
    return false
  }
}

export async function trackVisitor(userId?: string): Promise<void> {
  try {
    const visitorId = await getVisitorId()
    if (!visitorId) return

    if (typeof window !== 'undefined') {
      localStorage.setItem('visitor_id', visitorId)
    }

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
