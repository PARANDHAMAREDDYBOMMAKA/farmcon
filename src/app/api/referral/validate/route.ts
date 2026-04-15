import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { notFound, ok, parseQuery, withLogging } from '@/lib/api'
import { resolveReferralCode } from '@/lib/referral/codes'

const querySchema = z.object({
  code: z.string().min(4).max(12),
})

export const GET = withLogging(async (request: NextRequest, { requestId }) => {
  const parsed = parseQuery(request, querySchema, requestId)
  if (!parsed.ok) return parsed.response

  const referrerId = await resolveReferralCode(parsed.data.code)
  if (!referrerId) {
    return notFound('Invalid referral code', requestId)
  }

  return ok({
    valid: true,
    benefit: {
      newUser: '₹100 credit on first order',
      referrer: '₹100 credit when new user places first order',
    },
  })
})
