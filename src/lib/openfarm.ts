

const BASE_URL = 'https://openfarm.cc/api/v1'

export interface Crop {
  id: string
  type: string
  attributes: {
    name: string
    slug: string
    binomial_name?: string
    description?: string
    sun_requirements?: string
    sowing_method?: string
    spread?: number
    row_spacing?: number
    height?: number
    processing_pictures?: number
    thumbnail_image?: string
    main_image_path?: string
    tags_array?: string[]
    growing_degree_days?: number
    svg_icon?: string
  }
  relationships?: {
    guides?: {
      data: Array<{ id: string; type: string }>
    }
  }
}

export interface Guide {
  id: string
  type: string
  attributes: {
    name: string
    featured_image?: string
    overview?: string
    location?: string
    practices?: string[]
  }
}

export interface CropDetails extends Crop {
  companions?: Crop[]
  guides?: Guide[]
}

export async function searchCrops(query: string): Promise<Crop[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/crops?filter=${encodeURIComponent(query)}`,
      {
        next: { revalidate: 3600 }, 
      }
    )

    if (!response.ok) {
      throw new Error(`OpenFarm API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error searching crops:', error)
    return []
  }
}

export async function getCropBySlug(slug: string): Promise<CropDetails | null> {
  try {
    const response = await fetch(`${BASE_URL}/crops/${slug}`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`OpenFarm API error: ${response.statusText}`)
    }

    const data = await response.json()

    let companions: Crop[] = []
    if (data.data?.relationships?.companions?.data) {
      const companionPromises = data.data.relationships.companions.data.map(
        (comp: { id: string }) => fetch(`${BASE_URL}/crops/${comp.id}`).then((r) => r.json())
      )
      const companionResults = await Promise.all(companionPromises)
      companions = companionResults.map((r) => r.data).filter(Boolean)
    }

    let guides: Guide[] = []
    if (data.data?.relationships?.guides?.data) {
      const guidePromises = data.data.relationships.guides.data.map(
        (guide: { id: string }) =>
          fetch(`${BASE_URL}/guides/${guide.id}`).then((r) => r.json())
      )
      const guideResults = await Promise.all(guidePromises)
      guides = guideResults.map((r) => r.data).filter(Boolean)
    }

    return {
      ...data.data,
      companions,
      guides,
    }
  } catch (error) {
    console.error('Error fetching crop details:', error)
    return null
  }
}

export async function getAllCrops(page: number = 1): Promise<{
  crops: Crop[]
  total: number
  hasMore: boolean
}> {
  try {
    const response = await fetch(`${BASE_URL}/crops?page=${page}`, {
      next: { revalidate: 3600 },
    })

    if (!response.ok) {
      throw new Error(`OpenFarm API error: ${response.statusText}`)
    }

    const data = await response.json()

    return {
      crops: data.data || [],
      total: data.meta?.total || 0,
      hasMore: data.links?.next != null,
    }
  } catch (error) {
    console.error('Error fetching all crops:', error)
    return { crops: [], total: 0, hasMore: false }
  }
}

export async function getCropGuide(cropSlug: string): Promise<Guide | null> {
  try {
    const crop = await getCropBySlug(cropSlug)
    if (!crop || !crop.guides || crop.guides.length === 0) {
      return null
    }

    return crop.guides[0]
  } catch (error) {
    console.error('Error fetching crop guide:', error)
    return null
  }
}

export async function getCompanionPlants(cropSlug: string): Promise<Crop[]> {
  try {
    const crop = await getCropBySlug(cropSlug)
    return crop?.companions || []
  } catch (error) {
    console.error('Error fetching companion plants:', error)
    return []
  }
}

export async function searchCropsByTag(tag: string): Promise<Crop[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/crops?filter[tags]=${encodeURIComponent(tag)}`,
      {
        next: { revalidate: 3600 },
      }
    )

    if (!response.ok) {
      throw new Error(`OpenFarm API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Error searching crops by tag:', error)
    return []
  }
}

export async function getPopularCrops(limit: number = 10): Promise<Crop[]> {
  try {
    const { crops } = await getAllCrops(1)

    const cropsWithGuides = crops.filter(
      (crop) => crop.relationships?.guides?.data && crop.relationships.guides.data.length > 0
    )

    return cropsWithGuides.slice(0, limit)
  } catch (error) {
    console.error('Error fetching popular crops:', error)
    return []
  }
}

export function formatCropInfo(crop: Crop): {
  name: string
  scientificName: string
  description: string
  sunRequirements: string
  spacing: string
  image: string
} {
  return {
    name: crop.attributes.name,
    scientificName: crop.attributes.binomial_name || 'Unknown',
    description: crop.attributes.description || 'No description available',
    sunRequirements: crop.attributes.sun_requirements || 'Not specified',
    spacing: crop.attributes.row_spacing
      ? `${crop.attributes.row_spacing} inches`
      : 'Not specified',
    image: crop.attributes.main_image_path || crop.attributes.thumbnail_image || '',
  }
}
