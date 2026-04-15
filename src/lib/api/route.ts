import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { logger, getRequestId } from '@/lib/logger'
import { serverError } from './response'

type RouteHandler = (request: NextRequest, ctx: { requestId: string; params?: any }) => Promise<Response> | Response

export function withLogging(handler: RouteHandler) {
  return async function wrapped(request: NextRequest, ctx: any = {}) {
    const requestId = getRequestId(request.headers)
    const start = Date.now()
    const url = new URL(request.url)
    const log = logger.child({
      requestId,
      method: request.method,
      path: url.pathname,
    })

    try {
      const response = await handler(request, { ...ctx, requestId })
      const headers = new Headers(response.headers)
      headers.set('x-request-id', requestId)
      const duration = Date.now() - start
      log.info('request.completed', { status: response.status, durationMs: duration })
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    } catch (error) {
      const duration = Date.now() - start
      log.error('request.error', {
        durationMs: duration,
        error: error instanceof Error ? error.message : String(error),
      })
      const response = serverError(
        'An unexpected error occurred',
        process.env.NODE_ENV !== 'production'
          ? error instanceof Error
            ? error.message
            : String(error)
          : undefined,
        requestId,
      )
      const headers = new Headers(response.headers)
      headers.set('x-request-id', requestId)
      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      })
    }
  }
}
