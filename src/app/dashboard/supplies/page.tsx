'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { supabase } from '@/lib/supabase'
import { profileAPI, productsAPI } from '@/lib/api-client'
import type { Product, Category, User } from '@/types'

export default function SuppliesPage() {
  const [user, setUser] = useState<User | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [cartLoading, setCartLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/auth/signin')
        return
      }

      // Get user profile using API
      const profile = await profileAPI.getProfile(session.user.id)

      if (profile) {
        setUser(profile)
      }

      // Load products using API
      const productsData = await productsAPI.getProducts()
      setProducts(productsData)

      // For now, set empty categories array until we implement categories API
      setCategories([])

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async (productId: string, quantity: number = 1) => {
    if (!user) return
    
    setCartLoading(productId)
    
    try {
      // Add to cart via API
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId,
          quantity
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to cart')
      }
      
      // Show success message
      toast.success('Added to cart successfully!')

    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    } finally {
      setCartLoading(null)
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === '' || product.category_id === selectedCategory
    const matchesSearch = searchQuery === '' || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading supplies...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agricultural Supplies</h1>
            <p className="text-gray-600">Buy seeds, fertilizers, pesticides and farming equipment</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link
              href="/dashboard/cart"
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              🛒 View Cart
            </Link>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <div className="sm:w-48">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200">
              {product.images && product.images.length > 0 ? (
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="h-48 w-full object-cover object-center group-hover:opacity-75"
                />
              ) : (
                <div className="h-48 w-full bg-gray-200 flex items-center justify-center">
                  <span className="text-4xl">📦</span>
                </div>
              )}
            </div>
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
                {product.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                by {(product as any).profiles?.full_name || 'Unknown'}
              </p>
              {product.brand && (
                <p className="text-xs text-gray-500">Brand: {product.brand}</p>
              )}
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                {product.description}
              </p>
              <div className="mt-3 flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    ₹{product.price}
                  </p>
                  <p className="text-xs text-gray-500">per {product.unit}</p>
                </div>
                <div className="text-xs text-gray-500">
                  Stock: {product.stock_quantity}
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => addToCart(product.id)}
                  disabled={cartLoading === product.id || product.stock_quantity === 0}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {cartLoading === product.id ? 'Adding...' : 
                   product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
                <Link
                  href={`/dashboard/supplies/${product.id}`}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  View
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <span className="text-6xl">📦</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">No products found</h3>
          <p className="mt-2 text-gray-500">Try adjusting your search or category filter.</p>
        </div>
      )}
    </div>
  )
}