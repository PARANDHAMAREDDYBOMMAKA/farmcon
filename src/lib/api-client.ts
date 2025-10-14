
import type { UserRole } from '@/types'

class APIError extends Error {
  constructor(message: string, public status: number) {
    super(message)
    this.name = 'APIError'
  }
}

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(endpoint, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
    throw new APIError(errorData.error || 'API request failed', response.status)
  }

  return response.json()
}

export const profileAPI = {
  
  async getProfile(userId: string) {
    const data = await apiCall(`/api/profile?userId=${userId}`)
    return data.profile
  },

  async upsertProfile(profileData: {
    id: string
    email: string
    fullName?: string
    phone?: string
    role: UserRole
    city?: string
    state?: string
    address?: string
    pincode?: string
    businessName?: string
    gstNumber?: string
  }) {
    const data = await apiCall('/api/profile', {
      method: 'POST',
      body: JSON.stringify(profileData),
    })
    return data.profile
  },

  async updateProfile(userId: string, updates: {
    fullName?: string
    phone?: string
    city?: string
    state?: string
    address?: string
    pincode?: string
    businessName?: string
    gstNumber?: string
  }) {
    const data = await apiCall('/api/profile', {
      method: 'PUT',
      body: JSON.stringify({ userId, ...updates }),
    })
    return data.profile
  }
}

export const farmerAPI = {
  
  async getFarmerProfile(userId: string) {
    const data = await apiCall(`/api/farmer?userId=${userId}`)
    return data.farmerProfile
  },

  async upsertFarmerProfile(farmerData: {
    id: string
    farmName?: string
    farmLocation?: string
    farmSize?: number
    farmingExperience?: number
    farmingType?: string[]
    bankAccount?: string
    ifscCode?: string
    panNumber?: string
    aadharNumber?: string
    soilType?: string
    waterSource?: string[]
  }) {
    const data = await apiCall('/api/farmer', {
      method: 'POST',
      body: JSON.stringify(farmerData),
    })
    return data.farmerProfile
  }
}

export const dashboardAPI = {
  async getStats(userId: string, userRole: UserRole) {
    const data = await apiCall(`/api/dashboard/stats?userId=${userId}&role=${userRole}`)
    return data.stats
  }
}

export const cropsAPI = {
  async getCrops(farmerId: string) {
    const data = await apiCall(`/api/crops?farmerId=${farmerId}`)
    return data.crops
  },

  async getCrop(cropId: string) {
    const data = await apiCall(`/api/crops/${cropId}`)
    return data.crop
  },

  async createCrop(cropData: any) {
    const data = await apiCall('/api/crops', {
      method: 'POST',
      body: JSON.stringify(cropData),
    })
    return data.crop
  },

  async updateCrop(cropId: string, cropData: any) {
    const data = await apiCall(`/api/crops/${cropId}`, {
      method: 'PUT',
      body: JSON.stringify(cropData),
    })
    return data.crop
  },

  async deleteCrop(cropId: string) {
    const data = await apiCall(`/api/crops/${cropId}`, {
      method: 'DELETE',
    })
    return data.success
  }
}

export const productsAPI = {
  async getProducts(supplierId?: string, category?: string) {
    let url = '/api/products?'
    if (supplierId) url += `supplierId=${supplierId}&`
    if (category) url += `category=${category}&`
    
    const data = await apiCall(url)
    return data.products
  },

  async getProductById(productId: string) {
    const data = await apiCall(`/api/products/${productId}`)
    return data.product
  },

  async createProduct(productData: any) {
    const data = await apiCall('/api/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    })
    return data.product
  }
}

export const ordersAPI = {
  async getOrders(userId: string, type: 'customer' | 'seller' = 'customer') {
    const data = await apiCall(`/api/orders?userId=${userId}&type=${type}`)
    return data.orders
  },

  async getOrderById(orderId: string) {
    const data = await apiCall(`/api/orders/${orderId}`)
    return data.order
  },

  async createOrder(orderData: any) {
    const data = await apiCall('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    })
    return data.order
  },

  async updateOrderStatus(orderId: string, updates: { status?: string; paymentStatus?: string; notes?: string }) {
    const data = await apiCall(`/api/orders/${orderId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    return data.order
  },

  async generateInvoice(orderId: string) {
    const response = await fetch(`/api/orders/${orderId}/invoice`)
    if (!response.ok) {
      throw new Error('Failed to generate invoice')
    }
    return response.text()
  },

  async downloadInvoice(orderId: string) {
    const url = `/api/orders/${orderId}/invoice`
    const link = document.createElement('a')
    link.href = url
    link.target = '_blank'
    link.click()
  }
}

export const equipmentAPI = {
  async getEquipment(ownerId?: string) {
    let url = '/api/equipment'
    if (ownerId) url += `?ownerId=${ownerId}`
    
    const data = await apiCall(url)
    return data.equipment
  },

  async getEquipmentById(equipmentId: string) {
    const data = await apiCall(`/api/equipment/${equipmentId}`)
    return data.equipment
  },

  async createEquipment(equipmentData: any) {
    const data = await apiCall('/api/equipment', {
      method: 'POST',
      body: JSON.stringify(equipmentData),
    })
    return data.equipment
  },

  async updateEquipment(equipmentId: string, equipmentData: any) {
    const data = await apiCall(`/api/equipment/${equipmentId}`, {
      method: 'PUT',
      body: JSON.stringify(equipmentData),
    })
    return data.equipment
  },

  async deleteEquipment(equipmentId: string) {
    const data = await apiCall(`/api/equipment/${equipmentId}`, {
      method: 'DELETE',
    })
    return data.success
  }
}

export const reviewsAPI = {
  async getReviews(productId: string) {
    const data = await apiCall(`/api/reviews?productId=${productId}`)
    return data.reviews
  },

  async createReview(reviewData: {
    productId: string
    reviewerId: string
    rating: number
    comment?: string
  }) {
    const data = await apiCall('/api/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    })
    return data.review
  }
}

export { APIError }