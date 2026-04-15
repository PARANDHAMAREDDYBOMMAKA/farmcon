import { cache } from '@/lib/redis'

const CODE_TO_USER_KEY = (code: string) => `farmcon:ref:code:${code.toUpperCase()}`
const USER_TO_CODE_KEY = (userId: string) => `farmcon:ref:user:${userId}`
const ATTRIBUTION_KEY = (userId: string) => `farmcon:ref:attr:${userId}`
const REFERRAL_COUNT_KEY = (userId: string) => `farmcon:ref:count:${userId}`
const REFERRAL_CREDITS_KEY = (userId: string) => `farmcon:ref:credits:${userId}`
const REFERRED_SET_KEY = (userId: string) => `farmcon:ref:referred:${userId}`

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function encode(id: string): string {
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash + id.charCodeAt(i)) | 0
  }
  let value = Math.abs(hash)
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += ALPHABET[value % ALPHABET.length]
    value = Math.floor(value / ALPHABET.length)
  }
  return out.padEnd(6, ALPHABET[0])
}

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await cache.get<string>(USER_TO_CODE_KEY(userId)).catch(() => null)
  if (existing) return existing

  let code = encode(userId)
  let attempt = 0
  while (attempt < 5) {
    const owner = await cache.get<string>(CODE_TO_USER_KEY(code)).catch(() => null)
    if (!owner || owner === userId) break
    code = encode(userId + ':' + attempt)
    attempt++
  }

  await Promise.all([
    cache.set(CODE_TO_USER_KEY(code), userId, 60 * 60 * 24 * 365),
    cache.set(USER_TO_CODE_KEY(userId), code, 60 * 60 * 24 * 365),
  ])
  return code
}

export async function resolveReferralCode(code: string): Promise<string | null> {
  if (!code || code.length < 4) return null
  return cache.get<string>(CODE_TO_USER_KEY(code)).catch(() => null)
}

export async function recordAttribution(
  newUserId: string,
  referrerUserId: string,
): Promise<{ credited: boolean; totalReferrals: number }> {
  if (newUserId === referrerUserId) {
    return { credited: false, totalReferrals: 0 }
  }

  const existing = await cache.get<string>(ATTRIBUTION_KEY(newUserId)).catch(() => null)
  if (existing) {
    const count = (await cache.get<number>(REFERRAL_COUNT_KEY(referrerUserId))) || 0
    return { credited: false, totalReferrals: count }
  }

  await Promise.all([
    cache.set(ATTRIBUTION_KEY(newUserId), referrerUserId, 60 * 60 * 24 * 365 * 2),
    cache.sadd(REFERRED_SET_KEY(referrerUserId), newUserId, 60 * 60 * 24 * 365 * 2),
    cache.incr(REFERRAL_COUNT_KEY(referrerUserId), 60 * 60 * 24 * 365 * 2),
    cache.incr(REFERRAL_CREDITS_KEY(referrerUserId), 60 * 60 * 24 * 365 * 2),
  ])

  const count = (await cache.get<number>(REFERRAL_COUNT_KEY(referrerUserId))) || 1
  return { credited: true, totalReferrals: count }
}

export async function getReferralStats(userId: string) {
  const [code, count, credits] = await Promise.all([
    getOrCreateReferralCode(userId),
    cache.get<number>(REFERRAL_COUNT_KEY(userId)).catch(() => 0),
    cache.get<number>(REFERRAL_CREDITS_KEY(userId)).catch(() => 0),
  ])
  return {
    code,
    totalReferrals: count || 0,
    pendingCredits: credits || 0,
    shareUrl: buildShareUrl(code),
  }
}

export function buildShareUrl(code: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'https://farmcon.in'
  return `${base}/auth/signup?ref=${code}`
}
