import { NextRequest, NextResponse } from 'next/server'
import { search, INDEXES } from '@/lib/meilisearch'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const index = searchParams.get('index') || 'products'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    const filter = searchParams.get('filter') || undefined
    const sort = searchParams.get('sort')?.split(',') || undefined

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Validate index
    const validIndexes = Object.values(INDEXES)
    if (!validIndexes.includes(index as any)) {
      return NextResponse.json(
        { error: 'Invalid index. Valid indexes: ' + validIndexes.join(', ') },
        { status: 400 }
      )
    }

    // Perform search
    const results = await search(index, query, {
      limit,
      offset,
      filter,
      sort,
    })

    return NextResponse.json({
      results: results.hits,
      total: results.estimatedTotalHits,
      processingTimeMs: results.processingTimeMs,
      query: results.query,
      limit,
      offset,
    })
  } catch (error: any) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed', details: error.message },
      { status: 500 }
    )
  }
}
