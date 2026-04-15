import { z } from 'zod'

export const paginationQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['asc', 'desc']).default('desc'),
})

export type PaginationQuery = z.infer<typeof paginationQuerySchema>

export type PageMeta = {
  limit: number
  returned: number
  nextCursor?: string
  hasMore: boolean
  total?: number
}

export function buildPageMeta<T extends { id: string }>(
  items: T[],
  query: PaginationQuery,
  total?: number,
): PageMeta {
  const hasMore = items.length === query.limit
  const nextCursor = hasMore ? items[items.length - 1]?.id : undefined
  return {
    limit: query.limit,
    returned: items.length,
    hasMore,
    ...(nextCursor ? { nextCursor } : {}),
    ...(typeof total === 'number' ? { total } : {}),
  }
}
