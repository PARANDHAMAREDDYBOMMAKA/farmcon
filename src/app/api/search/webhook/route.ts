import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Webhook endpoint for real-time Meilisearch sync
 * Call this endpoint when products/crops/equipment are added/updated
 */
export async function POST(request: NextRequest) {
  try {
    const { type, id } = await request.json()

    if (!process.env.MEILISEARCH_HOST || !process.env.MEILISEARCH_API_KEY) {
      return NextResponse.json(
        { error: 'Meilisearch not configured' },
        { status: 503 }
      )
    }

    const { updateDocuments, INDEXES } = await import('@/lib/meilisearch')

    // Sync based on type
    switch (type) {
      case 'product':
        const product = await prisma.product.findUnique({
          where: { id },
          include: { category: true, supplier: true }
        })
        if (product) {
          const doc = {
            id: product.id,
            name: product.name,
            description: product.description || '',
            price: product.price,
            brand: product.brand || '',
            category: product.category?.name || '',
            categoryId: product.categoryId,
            supplierId: product.supplierId,
            isActive: product.isActive,
            stockQuantity: product.stockQuantity,
            images: product.images,
            unit: product.unit,
            createdAt: product.createdAt.toISOString(),
          }
          await updateDocuments(INDEXES.products, [doc])
        }
        break

      case 'crop':
        const crop = await prisma.crop.findUnique({
          where: { id },
          include: { farmer: true }
        })
        if (crop) {
          const doc = {
            id: crop.id,
            name: crop.name,
            variety: crop.variety || '',
            description: crop.description || '',
            farmerId: crop.farmerId,
            status: crop.status,
            plantedDate: crop.plantedDate?.toISOString(),
            expectedHarvestDate: crop.expectedHarvestDate?.toISOString(),
          }
          await updateDocuments(INDEXES.crops, [doc])
        }
        break

      case 'equipment':
        const equipment = await prisma.equipment.findUnique({
          where: { id },
          include: { owner: true }
        })
        if (equipment) {
          const doc = {
            id: equipment.id,
            name: equipment.name,
            description: equipment.description || '',
            category: equipment.category,
            brand: equipment.brand || '',
            model: equipment.model || '',
            ownerId: equipment.ownerId,
            status: equipment.status,
            hourlyRate: equipment.hourlyRate,
            dailyRate: equipment.dailyRate,
            yearManufactured: equipment.yearManufactured,
            images: equipment.images,
          }
          await updateDocuments(INDEXES.equipment, [doc])
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }

    return NextResponse.json({ message: 'Synced successfully' })
  } catch (error: any) {
    console.error('Webhook sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    )
  }
}
