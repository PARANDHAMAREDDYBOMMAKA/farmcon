import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { badRequest, notFound, ok, parseBody, requireUser, withLogging } from '@/lib/api'
import { enforceRateLimit } from '@/lib/api/rate-limit'
import { recordAttribution, resolveReferralCode } from '@/lib/referral/codes'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

const bodySchema = z.object({
  code: z
    .string()
    .min(4)
    .max(12)
    .transform((v) => v.trim().toUpperCase()),
})

export const POST = withLogging(async (request: NextRequest, { requestId }) => {
  const limited = await enforceRateLimit(request, {
    bucket: 'referral-apply',
    limit: 10,
    windowSeconds: 3600,
    requestId,
  })
  if (limited) return limited

  const auth = await requireUser(request, { requestId })
  if (!auth.ok) return auth.response

  const parsed = await parseBody(request, bodySchema, requestId)
  if (!parsed.ok) return parsed.response

  const referrerId = await resolveReferralCode(parsed.data.code)
  if (!referrerId) {
    return notFound('Invalid or expired referral code', requestId)
  }
  if (referrerId === auth.user.id) {
    return badRequest('You cannot use your own referral code', undefined, requestId)
  }

  const result = await recordAttribution(auth.user.id, referrerId)
  logger.info('referral.applied', {
    userId: auth.user.id,
    referrerId,
    credited: result.credited,
    requestId,
  })

  return ok({
    credited: result.credited,
    totalReferrals: result.totalReferrals,
    message: result.credited
      ? 'Referral applied. Both of you will receive ₹100 credit on your first qualifying order.'
      : 'A referral was already recorded for this account.',
  })
})
