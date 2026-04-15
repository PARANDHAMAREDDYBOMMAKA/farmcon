import { NextResponse } from 'next/server'

export type ApiOk<T> = { ok: true; data: T; meta?: Record<string, unknown> }
export type ApiErr = {
  ok: false
  error: {
    code: string
    message: string
    details?: unknown
    requestId?: string
  }
}

export function ok<T>(
  data: T,
  init?: { status?: number; meta?: Record<string, unknown>; headers?: HeadersInit },
) {
  return NextResponse.json<ApiOk<T>>(
    { ok: true, data, ...(init?.meta ? { meta: init.meta } : {}) },
    { status: init?.status ?? 200, headers: init?.headers },
  )
}

export function fail(
  message: string,
  init?: {
    code?: string
    status?: number
    details?: unknown
    requestId?: string
    headers?: HeadersInit
  },
) {
  return NextResponse.json<ApiErr>(
    {
      ok: false,
      error: {
        code: init?.code ?? 'internal_error',
        message,
        ...(init?.details !== undefined ? { details: init.details } : {}),
        ...(init?.requestId ? { requestId: init.requestId } : {}),
      },
    },
    { status: init?.status ?? 500, headers: init?.headers },
  )
}

export function badRequest(message: string, details?: unknown, requestId?: string) {
  return fail(message, { code: 'bad_request', status: 400, details, requestId })
}

export function unauthorized(message = 'Authentication required', requestId?: string) {
  return fail(message, { code: 'unauthorized', status: 401, requestId })
}

export function forbidden(message = 'Forbidden', requestId?: string) {
  return fail(message, { code: 'forbidden', status: 403, requestId })
}

export function notFound(message = 'Not found', requestId?: string) {
  return fail(message, { code: 'not_found', status: 404, requestId })
}

export function tooMany(message = 'Rate limit exceeded', retryAfter?: number, requestId?: string) {
  const headers = retryAfter ? { 'Retry-After': String(retryAfter) } : undefined
  return fail(message, { code: 'rate_limited', status: 429, requestId, headers })
}

export function serverError(message: string, details?: unknown, requestId?: string) {
  return fail(message, { code: 'internal_error', status: 500, details, requestId })
}
