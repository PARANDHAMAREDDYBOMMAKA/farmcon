import { MeiliSearch } from 'meilisearch'

const client = new MeiliSearch({
  host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILISEARCH_API_KEY || '',
})

// Index names
export const INDEXES = {
  products: 'products',
  crops: 'crops',
  equipment: 'equipment',
  suppliers: 'suppliers',
  farmers: 'farmers',
} as const

// Initialize indexes with settings
export async function initializeIndexes() {
  try {
    // Products index
    const productsIndex = client.index(INDEXES.products)
    await productsIndex.updateSettings({
      searchableAttributes: ['name', 'description', 'brand', 'category'],
      filterableAttributes: ['categoryId', 'supplierId', 'price', 'isActive'],
      sortableAttributes: ['price', 'createdAt', 'stockQuantity'],
      rankingRules: [
        'words',
        'typo',
        'proximity',
        'attribute',
        'sort',
        'exactness',
        'price:asc',
      ],
    })

    // Crops index
    const cropsIndex = client.index(INDEXES.crops)
    await cropsIndex.updateSettings({
      searchableAttributes: ['name', 'variety', 'description'],
      filterableAttributes: ['farmerId', 'status', 'season'],
      sortableAttributes: ['plantedDate', 'expectedHarvestDate'],
    })

    // Equipment index
    const equipmentIndex = client.index(INDEXES.equipment)
    await equipmentIndex.updateSettings({
      searchableAttributes: ['name', 'description', 'brand', 'model', 'category'],
      filterableAttributes: ['category', 'ownerId', 'status', 'hourlyRate', 'dailyRate'],
      sortableAttributes: ['hourlyRate', 'dailyRate', 'yearManufactured'],
    })

    // Suppliers index
    const suppliersIndex = client.index(INDEXES.suppliers)
    await suppliersIndex.updateSettings({
      searchableAttributes: ['fullName', 'businessName', 'city', 'state', 'email'],
      filterableAttributes: ['city', 'state', 'role'],
    })

    // Farmers index
    const farmersIndex = client.index(INDEXES.farmers)
    await farmersIndex.updateSettings({
      searchableAttributes: ['fullName', 'city', 'state', 'email'],
      filterableAttributes: ['city', 'state', 'role'],
    })

    console.log('✅ MeiliSearch indexes initialized')
  } catch (error) {
    console.error('❌ Error initializing MeiliSearch indexes:', error)
  }
}

// Add documents to index
export async function addDocuments(indexName: string, documents: any[]) {
  try {
    const index = client.index(indexName)
    const response = await index.addDocuments(documents)
    return response
  } catch (error) {
    console.error(`Error adding documents to ${indexName}:`, error)
    throw error
  }
}

// Update documents in index
export async function updateDocuments(indexName: string, documents: any[]) {
  try {
    const index = client.index(indexName)
    const response = await index.updateDocuments(documents)
    return response
  } catch (error) {
    console.error(`Error updating documents in ${indexName}:`, error)
    throw error
  }
}

// Delete documents from index
export async function deleteDocuments(indexName: string, documentIds: string[]) {
  try {
    const index = client.index(indexName)
    const response = await index.deleteDocuments(documentIds)
    return response
  } catch (error) {
    console.error(`Error deleting documents from ${indexName}:`, error)
    throw error
  }
}

// Search in index
export async function search(
  indexName: string,
  query: string,
  options: {
    limit?: number
    offset?: number
    filter?: string
    sort?: string[]
  } = {}
) {
  try {
    const index = client.index(indexName)
    const response = await index.search(query, {
      limit: options.limit || 20,
      offset: options.offset || 0,
      filter: options.filter,
      sort: options.sort,
    })
    return response
  } catch (error) {
    console.error(`Error searching in ${indexName}:`, error)
    throw error
  }
}

export default client
