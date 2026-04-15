import type { NextRequest } from 'next/server'
import { ok, requireUser, serverError, withLogging } from '@/lib/api'
import { getReferralStats } from '@/lib/referral/codes'
import { logger } from '@/lib/logger'

export const dynamic = 'force-dynamic'

export const GET = withLogging(async (request: NextRequest, { requestId }) => {
  const auth = await requireUser(request, { requestId })
  if (!auth.ok) return auth.response

  try {
    const stats = await getReferralStats(auth.user.id)
    return ok(stats)
  } catch (error) {
    logger.error('referral.me.failed', {
      userId: auth.user.id,
      requestId,
      error: error instanceof Error ? error.message : String(error),
    })
    return serverError(
      'Failed to load referral info',
      error instanceof Error ? error.message : undefined,
      requestId,
    )
  }
})
