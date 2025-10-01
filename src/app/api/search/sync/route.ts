import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { addDocuments, INDEXES, initializeIndexes } from '@/lib/meilisearch'

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const index = searchParams.get('index')

    // Initialize indexes first
    await initializeIndexes()

    if (!index || index === 'all') {
      // Sync all indexes
      await syncProducts()
      await syncCrops()
      await syncEquipment()
      await syncSuppliers()
      await syncFarmers()

      return NextResponse.json({
        message: 'All indexes synced successfully',
      })
    }

    // Sync specific index
    switch (index) {
      case INDEXES.products:
        await syncProducts()
        break
      case INDEXES.crops:
        await syncCrops()
        break
      case INDEXES.equipment:
        await syncEquipment()
        break
      case INDEXES.suppliers:
        await syncSuppliers()
        break
      case INDEXES.farmers:
        await syncFarmers()
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
async function syncProducts() {
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
async function syncCrops() {
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
    season: crop.season || '',
    plantedDate: crop.plantedDate?.toISOString(),
    expectedHarvestDate: crop.expectedHarvestDate?.toISOString(),
  }))

  await addDocuments(INDEXES.crops, documents)
  console.log(`✅ Synced ${documents.length} crops`)
}

// Sync equipment
async function syncEquipment() {
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
async function syncSuppliers() {
  const suppliers = await prisma.user.findMany({
    where: { role: 'supplier' },
  })

  const documents = suppliers.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    businessName: user.businessName || '',
    email: user.email,
    city: user.city || '',
    state: user.state || '',
    role: user.role,
  }))

  await addDocuments(INDEXES.suppliers, documents)
  console.log(`✅ Synced ${documents.length} suppliers`)
}

// Sync farmers
async function syncFarmers() {
  const farmers = await prisma.user.findMany({
    where: { role: 'farmer' },
  })

  const documents = farmers.map((user) => ({
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    city: user.city || '',
    state: user.state || '',
    role: user.role,
  }))

  await addDocuments(INDEXES.farmers, documents)
  console.log(`✅ Synced ${documents.length} farmers`)
}
