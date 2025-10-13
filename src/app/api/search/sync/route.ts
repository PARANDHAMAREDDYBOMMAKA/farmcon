import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET handler for Vercel Cron Jobs
export async function GET(request: NextRequest) {
  return handleSync(request)
}

// POST handler for manual sync
export async function POST(request: NextRequest) {
  return handleSync(request)
}

async function handleSync(request: NextRequest) {
  try {
    // Check if MeiliSearch is configured before importing
    if (!process.env.MEILISEARCH_HOST || !process.env.MEILISEARCH_API_KEY) {
      return NextResponse.json(
        { error: 'Search sync is not available. MeiliSearch is not configured.' },
        { status: 503 }
      )
    }

    // Lazy load MeiliSearch
    const { addDocuments, INDEXES, initializeIndexes } = await import('@/lib/meilisearch')

    const { searchParams } = new URL(request.url)
    const index = searchParams.get('index')

    // Initialize indexes first
    await initializeIndexes()

    if (!index || index === 'all') {
      // Sync all indexes
      await syncProducts(addDocuments, INDEXES)
      await syncCrops(addDocuments, INDEXES)
      await syncEquipment(addDocuments, INDEXES)
      await syncSuppliers(addDocuments, INDEXES)
      await syncFarmers(addDocuments, INDEXES)

      return NextResponse.json({
        message: 'All indexes synced successfully',
      })
    }

    // Sync specific index
    switch (index) {
      case INDEXES.products:
        await syncProducts(addDocuments, INDEXES)
        break
      case INDEXES.crops:
        await syncCrops(addDocuments, INDEXES)
        break
      case INDEXES.equipment:
        await syncEquipment(addDocuments, INDEXES)
        break
      case INDEXES.suppliers:
        await syncSuppliers(addDocuments, INDEXES)
        break
      case INDEXES.farmers:
        await syncFarmers(addDocuments, INDEXES)
        break
      default:
        return NextResponse.json({ error: 'Invalid index' }, { status: 400 })
    }

    return NextResponse.json({
      message: `Index ${index} synced successfully`,
    })
  } catch (error: any) {
    console.error('Sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    )
  }
}

// Sync products
async function syncProducts(addDocuments: any, INDEXES: any) {
  const products = await prisma.product.findMany({
    include: {
      category: true,
      supplier: true,
    },
  })

  const documents = products.map((product) => ({
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
  }))

  await addDocuments(INDEXES.products, documents)
  console.log(`✅ Synced ${documents.length} products`)
}

// Sync crops
async function syncCrops(addDocuments: any, INDEXES: any) {
  const crops = await prisma.crop.findMany({
    include: {
      farmer: true,
    },
  })

  const documents = crops.map((crop) => ({
    id: crop.id,
    name: crop.name,
    variety: crop.variety || '',
    description: crop.description || '',
    farmerId: crop.farmerId,
    status: crop.status,
    plantedDate: crop.plantedDate?.toISOString(),
    expectedHarvestDate: crop.expectedHarvestDate?.toISOString(),
  }))

  await addDocuments(INDEXES.crops, documents)
  console.log(`✅ Synced ${documents.length} crops`)
}

// Sync equipment
async function syncEquipment(addDocuments: any, INDEXES: any) {
  const equipment = await prisma.equipment.findMany({
    include: {
      owner: true,
    },
  })

  const documents = equipment.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description || '',
    category: item.category,
    brand: item.brand || '',
    model: item.model || '',
    ownerId: item.ownerId,
    status: item.status,
    hourlyRate: item.hourlyRate,
    dailyRate: item.dailyRate,
    yearManufactured: item.yearManufactured,
    images: item.images,
  }))

  await addDocuments(INDEXES.equipment, documents)
  console.log(`✅ Synced ${documents.length} equipment items`)
}

// Sync suppliers
async function syncSuppliers(addDocuments: any, INDEXES: any) {
  const suppliers = await prisma.profile.findMany({
    where: { role: 'supplier' },
  })

  const documents = suppliers.map((profile) => ({
    id: profile.id,
    fullName: profile.fullName,
    businessName: profile.businessName || '',
    email: profile.email,
    city: profile.city || '',
    state: profile.state || '',
    role: profile.role,
  }))

  await addDocuments(INDEXES.suppliers, documents)
  console.log(`✅ Synced ${documents.length} suppliers`)
}

// Sync farmers
async function syncFarmers(addDocuments: any, INDEXES: any) {
  const farmers = await prisma.profile.findMany({
    where: { role: 'farmer' },
  })

  const documents = farmers.map((profile) => ({
    id: profile.id,
    fullName: profile.fullName,
    email: profile.email,
    city: profile.city || '',
    state: profile.state || '',
    role: profile.role,
  }))

  await addDocuments(INDEXES.farmers, documents)
  console.log(`✅ Synced ${documents.length} farmers`)
}
