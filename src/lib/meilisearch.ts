import { MeiliSearch } from 'meilisearch'

let client: MeiliSearch | null = null

function getClient(): MeiliSearch {
  if (!client) {
    const host = process.env.MEILISEARCH_HOST
    const apiKey = process.env.MEILISEARCH_API_KEY

    if (!host || !apiKey) {
      throw new Error('MeiliSearch is not configured. Set MEILISEARCH_HOST and MEILISEARCH_API_KEY environment variables.')
    }

    client = new MeiliSearch({ host, apiKey })
  }
  return client
}

export const INDEXES = {
  products: 'products',
  crops: 'crops',
  equipment: 'equipment',
  suppliers: 'suppliers',
  farmers: 'farmers',
} as const

export async function initializeIndexes() {
  try {
    const meilisearch = getClient()

    const productsIndex = meilisearch.index(INDEXES.products)
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

    const cropsIndex = meilisearch.index(INDEXES.crops)
    await cropsIndex.updateSettings({
      searchableAttributes: ['name', 'variety', 'description'],
      filterableAttributes: ['farmerId', 'status', 'season'],
      sortableAttributes: ['plantedDate', 'expectedHarvestDate'],
    })

    const equipmentIndex = meilisearch.index(INDEXES.equipment)
    await equipmentIndex.updateSettings({
      searchableAttributes: ['name', 'description', 'brand', 'model', 'category'],
      filterableAttributes: ['category', 'ownerId', 'status', 'hourlyRate', 'dailyRate'],
      sortableAttributes: ['hourlyRate', 'dailyRate', 'yearManufactured'],
    })

    const suppliersIndex = meilisearch.index(INDEXES.suppliers)
    await suppliersIndex.updateSettings({
      searchableAttributes: ['fullName', 'businessName', 'city', 'state', 'email'],
      filterableAttributes: ['city', 'state', 'role'],
    })

    const farmersIndex = meilisearch.index(INDEXES.farmers)
    await farmersIndex.updateSettings({
      searchableAttributes: ['fullName', 'city', 'state', 'email'],
      filterableAttributes: ['city', 'state', 'role'],
    })

    console.log('✅ MeiliSearch indexes initialized')
  } catch (error) {
    console.error('❌ Error initializing MeiliSearch indexes:', error)
  }
}

export async function addDocuments(indexName: string, documents: any[]) {
  if (documents.length === 0) {
    return { taskUid: 0 }
  }

  try {
    const meilisearch = getClient()
    const index = meilisearch.index(indexName)

    const task = await index.addDocuments(documents, { primaryKey: 'id' })

    await new Promise(resolve => setTimeout(resolve, 1000))

    return task
  } catch (error) {
    console.error(`Error adding documents to ${indexName}:`, error)
    throw error
  }
}

export async function updateDocuments(indexName: string, documents: any[]) {
  try {
    const meilisearch = getClient()
    const index = meilisearch.index(indexName)
    const response = await index.updateDocuments(documents)
    return response
  } catch (error) {
    console.error(`Error updating documents in ${indexName}:`, error)
    throw error
  }
}

export async function deleteDocuments(indexName: string, documentIds: string[]) {
  try {
    const meilisearch = getClient()
    const index = meilisearch.index(indexName)
    const response = await index.deleteDocuments(documentIds)
    return response
  } catch (error) {
    console.error(`Error deleting documents from ${indexName}:`, error)
    throw error
  }
}

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
    const meilisearch = getClient()
    const index = meilisearch.index(indexName)
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

export default getClient
