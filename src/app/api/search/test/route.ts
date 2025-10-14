import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    
    if (!process.env.MEILISEARCH_HOST || !process.env.MEILISEARCH_API_KEY) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'MeiliSearch is not configured',
          host: !!process.env.MEILISEARCH_HOST,
          apiKey: !!process.env.MEILISEARCH_API_KEY
        },
        { status: 503 }
      )
    }

    const { MeiliSearch } = await import('meilisearch')
    const client = new MeiliSearch({
      host: process.env.MEILISEARCH_HOST,
      apiKey: process.env.MEILISEARCH_API_KEY
    })

    const health = await client.health()

    const indexes = await client.getIndexes()
    const indexStats = await Promise.all(
      indexes.results.map(async (index) => {
        const stats = await index.getStats()
        return {
          name: index.uid,
          documentCount: stats.numberOfDocuments,
          isIndexing: stats.isIndexing
        }
      })
    )

    return NextResponse.json({
      status: 'success',
      message: 'MeiliSearch is connected and working',
      health,
      indexes: indexStats,
      config: {
        host: process.env.MEILISEARCH_HOST
      }
    })
  } catch (error: any) {
    console.error('MeiliSearch test error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to MeiliSearch',
        error: error.message,
        details: error.stack
      },
      { status: 500 }
    )
  }
}
