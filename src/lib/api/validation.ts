import type { NextRequest } from 'next/server'
import { ZodError, type ZodSchema } from 'zod'
import { badRequest } from './response'

function formatZodError(err: ZodError) {
  const issues = err.issues.map((issue) => ({
    path: issue.path.join('.') || '(root)',
    message: issue.message,
    code: issue.code,
  }))
  return {
    message: issues[0]?.message || 'Validation failed',
    issues,
  }
}

export async function parseBody<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  requestId?: string,
): Promise<{ ok: true; data: T } | { ok: false; response: Response }> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return { ok: false, response: badRequest('Invalid JSON body', undefined, requestId) }
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const { message, issues } = formatZodError(parsed.error)
    return { ok: false, response: badRequest(message, { issues }, requestId) }
  }
  return { ok: true, data: parsed.data }
}

export function parseQuery<T>(
  request: NextRequest,
  schema: ZodSchema<T>,
  requestId?: string,
): { ok: true; data: T } | { ok: false; response: Response } {
  const { searchParams } = new URL(request.url)
  const raw: Record<string, string | string[]> = {}
  for (const key of new Set(Array.from(searchParams.keys()))) {
    const values = searchParams.getAll(key)
    raw[key] = values.length === 1 ? values[0] : values
  }

  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const { message, issues } = formatZodError(parsed.error)
    return { ok: false, response: badRequest(message, { issues }, requestId) }
  }
  return { ok: true, data: parsed.data }
}
