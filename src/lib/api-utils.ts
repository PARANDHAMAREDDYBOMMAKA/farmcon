import { NextResponse } from 'next/server'
import { z, ZodError, ZodSchema } from 'zod'
import { logger } from './logger'
import { PrismaError } from './prisma'

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  code?: string
}

export const apiSuccess = <T>(data: T, status: number = 200): NextResponse => {
  return NextResponse.json({ success: true, data }, { status })
}

export const apiError = (
  message: string,
  status: number = 500,
  code?: string
): NextResponse => {
  return NextResponse.json(
    { success: false, error: message, code },
    { status }
  )
}

export const handleApiError = (error: unknown, context?: string): NextResponse => {
  if (error instanceof ZodError && error.errors && Array.isArray(error.errors)) {
    const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    logger.warn('Validation error', { context, errors: messages })
    return apiError(`Validation failed: ${messages}`, 400, 'VALIDATION_ERROR')
  }

  if (error && typeof error === 'object' && 'issues' in error && Array.isArray((error as any).issues)) {
    const zodLikeError = error as { issues: Array<{ path: string[]; message: string }> }
    const messages = zodLikeError.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
    logger.warn('Validation error', { context, errors: messages })
    return apiError(`Validation failed: ${messages}`, 400, 'VALIDATION_ERROR')
  }

  if (error instanceof PrismaError) {
    logger.error('Database error', { context, code: error.code, message: error.message })

    if (error.code === 'P2002') {
      return apiError('A record with this value already exists', 409, 'DUPLICATE_ENTRY')
    }
    if (error.code === 'P2025') {
      return apiError('Record not found', 404, 'NOT_FOUND')
    }

    return apiError('Database operation failed', 500, 'DATABASE_ERROR')
  }

  if (error instanceof Error) {
    logger.error('API error', { context, message: error.message })

    if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
      return apiError('Unauthorized', 401, 'UNAUTHORIZED')
    }
    if (error.message.includes('forbidden') || error.message.includes('Forbidden')) {
      return apiError('Forbidden', 403, 'FORBIDDEN')
    }
    if (error.message.includes('not found') || error.message.includes('Not found')) {
      return apiError('Resource not found', 404, 'NOT_FOUND')
    }

    return apiError(
      process.env.NODE_ENV === 'production' ? 'Internal server error' : error.message,
      500,
      'INTERNAL_ERROR'
    )
  }

  logger.error('Unknown error', { context, error })
  return apiError('An unexpected error occurred', 500, 'UNKNOWN_ERROR')
}

export const validateRequest = <T>(schema: ZodSchema<T>, data: unknown): T => {
  return schema.parse(data)
}

export const safeValidateRequest = <T>(
  schema: ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ZodError } => {
  const result = schema.safeParse(data)
  if (result.success) {
    return { success: true, data: result.data }
  }
  return { success: false, error: result.error }
}

export const parseJsonBody = async <T>(
  request: Request,
  schema: ZodSchema<T>
): Promise<T> => {
  const body = await request.json()
  return validateRequest(schema, body)
}

export const parseQueryParams = <T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): T => {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return validateRequest(schema, params)
}

export const withErrorHandler = (
  handler: (request: Request, context?: unknown) => Promise<NextResponse>,
  routeName: string
) => {
  return async (request: Request, context?: unknown): Promise<NextResponse> => {
    try {
      return await handler(request, context)
    } catch (error) {
      return handleApiError(error, routeName)
    }
  }
}

export const commonSchemas = {
  uuid: z.string().uuid(),
  email: z.string().email(),
  pagination: z.object({
    page: z.string().transform(Number).pipe(z.number().int().positive()).optional(),
    limit: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).optional(),
  }),
  id: z.object({
    id: z.string().uuid(),
  }),
}
