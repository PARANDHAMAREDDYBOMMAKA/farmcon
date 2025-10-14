import { NextRequest, NextResponse } from 'next/server'
import {
  searchCrops,
  getCropBySlug,
  getAllCrops,
  getCropGuide,
  getCompanionPlants,
  searchCropsByTag,
  getPopularCrops,
} from '@/lib/openfarm'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'search': {
        const query = searchParams.get('query')
        if (!query) {
          return NextResponse.json({ error: 'Query parameter required' }, { status: 400 })
        }
        const crops = await searchCrops(query)
        return NextResponse.json({ crops })
      }

      case 'crop': {
        const slug = searchParams.get('slug')
        if (!slug) {
          return NextResponse.json({ error: 'Slug parameter required' }, { status: 400 })
        }
        const crop = await getCropBySlug(slug)
        if (!crop) {
          return NextResponse.json({ error: 'Crop not found' }, { status: 404 })
        }
        return NextResponse.json({ crop })
      }

      case 'all': {
        const page = parseInt(searchParams.get('page') || '1')
        const data = await getAllCrops(page)
        return NextResponse.json(data)
      }

      case 'guide': {
        const slug = searchParams.get('slug')
        if (!slug) {
          return NextResponse.json({ error: 'Slug parameter required' }, { status: 400 })
        }
        const guide = await getCropGuide(slug)
        if (!guide) {
          return NextResponse.json({ error: 'Guide not found' }, { status: 404 })
        }
        return NextResponse.json({ guide })
      }

      case 'companions': {
        const slug = searchParams.get('slug')
        if (!slug) {
          return NextResponse.json({ error: 'Slug parameter required' }, { status: 400 })
        }
        const companions = await getCompanionPlants(slug)
        return NextResponse.json({ companions })
      }

      case 'tag': {
        const tag = searchParams.get('tag')
        if (!tag) {
          return NextResponse.json({ error: 'Tag parameter required' }, { status: 400 })
        }
        const crops = await searchCropsByTag(tag)
        return NextResponse.json({ crops })
      }

      case 'popular': {
        const limit = parseInt(searchParams.get('limit') || '10')
        const crops = await getPopularCrops(limit)
        return NextResponse.json({ crops })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: search, crop, all, guide, companions, tag, or popular' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('OpenFarm API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
