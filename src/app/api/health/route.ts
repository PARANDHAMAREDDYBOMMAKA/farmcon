import type { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cache } from '@/lib/redis'
import { ok, serverError, withLogging } from '@/lib/api'

type ServiceCheck = { status: 'ok' | 'degraded' | 'down'; latencyMs?: number; error?: string }

async function check(fn: () => Promise<void>): Promise<ServiceCheck> {
  const started = Date.now()
  try {
    await fn()
    return { status: 'ok', latencyMs: Date.now() - started }
  } catch (error) {
    return {
      status: 'down',
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

export const GET = withLogging(async (_request: NextRequest, { requestId }) => {
  const [db, redis] = await Promise.all([
    check(async () => {
      await prisma.$queryRaw`SELECT 1`
    }),
    check(async () => {
      await cache.set(`farmcon:health:${requestId}`, '1', 10)
      const value = await cache.get<string>(`farmcon:health:${requestId}`)
      if (value !== '1') throw new Error('Read-after-write mismatch')
    }),
  ])

  const allOk = db.status === 'ok' && redis.status === 'ok'
  const body = {
    status: allOk ? 'ok' : 'degraded',
    version: process.env.APP_VERSION || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev',
    environment: process.env.NODE_ENV,
    uptimeSec: typeof process !== 'undefined' ? Math.floor(process.uptime()) : undefined,
    timestamp: new Date().toISOString(),
    checks: { db, redis },
  }

  if (!allOk) return serverError('Service degraded', body, requestId)
  return ok(body, { status: 200 })
})
