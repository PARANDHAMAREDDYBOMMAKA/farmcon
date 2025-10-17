'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { Package } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  stockQuantity: number
  unit: string
  brand?: string
  images: string[]
  isActive: boolean
  specifications?: {
    weight?: string
    dimensions?: string
    material?: string
    manufacturer?: string
    countryOfOrigin?: string
    shelfLife?: string
  }
  category: {
    id: string
    name: string
  }
  supplier: {
    id: string
    fullName: string
    businessName: string
    city: string
    state: string
    phone: string
  }
  createdAt: string
  updatedAt: string
  averageRating?: number
  reviewCount?: number
}

export default function ViewProductPage() {
  const { user } = useAuth('supplier')
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<string>('')

  useEffect(() => {
    if (productId) {
      loadProduct()
    }
  }, [productId])

  const loadProduct = async () => {
    try {
      const response = await fetch(`/api/products/${productId}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data.product || data)
        if (data.product?.images && data.product.images.length > 0) {
          setSelectedImage(data.product.images[0])
        } else if (data.images && data.images.length > 0) {
          setSelectedImage(data.images[0])
        }
      } else {
        toast.error('Product not found')
        router.push('/dashboard/products')
      }
    } catch (error) {
      console.error('Error loading product:', error)
      toast.error('Failed to load product')
      router.push('/dashboard/products')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleStatus = async () => {
    if (!product) return

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !product.isActive })
      })

      if (response.ok) {
        setProduct(prev => prev ? { ...prev, isActive: !prev.isActive } : null)
        toast.success(`Product ${!product.isActive ? 'activated' : 'deactivated'} successfully`)
      } else {
        throw new Error('Failed to update product status')
      }
    } catch (error) {
      console.error('Error updating product status:', error)
      toast.error('Failed to update product status')
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'out', color: 'bg-red-100 text-red-800', label: 'Out of Stock' }
    if (stock < 10) return { status: 'low', color: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' }
    if (stock < 50) return { status: 'medium', color: 'bg-blue-100 text-blue-800', label: 'Medium Stock' }
    return { status: 'good', color: 'bg-green-100 text-green-800', label: 'Good Stock' }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Link
            href="/dashboard/products"
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg"
          >
            Back to Products
          </Link>
        </div>
      </div>
    )
  }

  const stockInfo = getStockStatus(product.stockQuantity)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
            <p className="text-gray-600 mt-1">Product Details</p>
          </div>
          <div className="flex space-x-3">
            <Link
              href={`/dashboard/products/${productId}/edit`}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
            >
              Edit Product
            </Link>
            <Link
              href="/dashboard/products"
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium"
            >
              Back to Products
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Images</h2>

          {product.images && product.images.length > 0 ? (
            <div className="space-y-4">
              {}
              <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={selectedImage || product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {}
              {product.images.length > 1 && (
                <div className="grid grid-cols-4 gap-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(image)}
                      className={`aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 ${
                        selectedImage === image ? 'border-orange-500' : 'border-transparent'
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <Package className="h-16 w-16 mx-auto text-gray-400" />
                <p className="text-gray-500 mt-2">No images available</p>
              </div>
            </div>
          )}
        </div>

        {}
        <div className="space-y-6">
          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Brand:</span>
                <span className="font-medium">{product.brand || 'No brand'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Category:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {product.category.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  product.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-gray-600">Description:</span>
                <p className="mt-1 text-gray-900">{product.description}</p>
              </div>
            </div>
          </div>

          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Pricing & Inventory</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-lg">₹{product.price.toLocaleString()} / {product.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Stock:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-medium">{product.stockQuantity} {product.unit}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockInfo.color}`}>
                    {stockInfo.label}
                  </span>
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Unit:</span>
                <span className="font-medium">{product.unit}</span>
              </div>
            </div>
          </div>

          {}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={handleToggleStatus}
                className={`w-full px-4 py-2 rounded-lg font-medium ${
                  product.isActive
                    ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                {product.isActive ? 'Deactivate Product' : 'Activate Product'}
              </button>
              <Link
                href={`/dashboard/products/${productId}/edit`}
                className="w-full block text-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-medium"
              >
                Edit Product
              </Link>
            </div>
          </div>
        </div>
      </div>

      {}
      {product.specifications && Object.keys(product.specifications).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(product.specifications).map(([key, value]) => {
              if (!value) return null
              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')
              return (
                <div key={key} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-600">{label}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Supplier Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Supplier:</span>
            <span className="font-medium">{product.supplier.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Business:</span>
            <span className="font-medium">{product.supplier.businessName || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Location:</span>
            <span className="font-medium">{product.supplier.city}, {product.supplier.state}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Contact:</span>
            <span className="font-medium">{product.supplier.phone}</span>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Product History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Created:</span>
            <span className="font-medium">{new Date(product.createdAt).toLocaleDateString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Last Updated:</span>
            <span className="font-medium">{new Date(product.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}