'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { productsAPI, reviewsAPI } from '@/lib/api-client'
import type { Product, Review } from '@/types'

export default function ProductDetailPage() {
  const { user, loading: authLoading } = useAuth()
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [cartLoading, setCartLoading] = useState(false)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const router = useRouter()
  const params = useParams()
  const productId = params?.id as string

  useEffect(() => {
    if (productId && user && !authLoading) {
      loadProduct()
    }
  }, [productId, user, authLoading])

  const loadProduct = async () => {
    if (!user) return
    
    try {
      // Load product details
      const productData = await productsAPI.getProductById(productId)
      
      if (!productData) {
        console.error('Product not found')
        router.push('/dashboard/supplies')
        return
      }

      setProduct(productData)

      // Load reviews
      const reviewsData = await reviewsAPI.getReviews(productId)
      setReviews(reviewsData || [])

    } catch (error) {
      console.error('Error loading product:', error)
      router.push('/dashboard/supplies')
    } finally {
      setLoading(false)
    }
  }

  const addToCart = async () => {
    if (!user || !product) return
    
    setCartLoading(true)
    
    try {
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          productId: product.id,
          quantity: quantity
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to add to cart')
      }

      toast.success('Added to cart successfully!')

    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    } finally {
      setCartLoading(false)
    }
  }

  const buyNow = async () => {
    // Add to cart and redirect to checkout
    await addToCart()
    router.push('/dashboard/cart')
  }

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-6">
        <div className="text-center">
          <span className="text-6xl">❌</span>
          <h3 className="mt-4 text-lg font-medium text-gray-900">Product not found</h3>
          <Link
            href="/dashboard/supplies"
            className="mt-4 inline-block text-green-600 hover:text-green-500"
          >
            ← Back to supplies
          </Link>
        </div>
      </div>
    )
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li>
            <Link href="/dashboard/supplies" className="text-gray-500 hover:text-gray-700">
              Supplies
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-900">{product.name}</span>
            </div>
          </li>
        </ol>
      </nav>

      <div className="lg:grid lg:grid-cols-2 lg:gap-8">
        {/* Product Images */}
        <div>
          <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
            {product.images && product.images.length > 0 ? (
              <img
                src={product.images[selectedImageIndex]}
                alt={product.name}
                className="h-96 w-full object-cover object-center"
              />
            ) : (
              <div className="h-96 w-full bg-gray-200 flex items-center justify-center">
                <span className="text-8xl">📦</span>
              </div>
            )}
          </div>
          {product.images && product.images.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-w-1 aspect-h-1 overflow-hidden rounded-lg ${
                    selectedImageIndex === index ? 'ring-2 ring-green-500' : ''
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="h-20 w-full object-cover object-center"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
          
          <div className="mt-2 flex items-center space-x-4">
            <div className="flex items-center">
              {[0, 1, 2, 3, 4].map((rating) => (
                <span
                  key={rating}
                  className={`text-sm ${rating < averageRating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                  ⭐
                </span>
              ))}
              <span className="ml-2 text-sm text-gray-500">
                ({reviews.length} reviews)
              </span>
            </div>
          </div>

          <div className="mt-4">
            <p className="text-3xl font-bold text-gray-900">₹{product.price}</p>
            <p className="text-sm text-gray-500">per {product.unit}</p>
          </div>

          {product.brand && (
            <div className="mt-4">
              <p className="text-sm text-gray-600">Brand: <span className="font-medium">{product.brand}</span></p>
            </div>
          )}

          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Sold by: <span className="font-medium">{(product as any).profiles?.full_name}</span>
            </p>
            <p className="text-sm text-gray-500">
              {(product as any).profiles?.city}, {(product as any).profiles?.state}
            </p>
          </div>

          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-900">Description</h3>
            <p className="mt-2 text-sm text-gray-600">{product.description}</p>
          </div>

          {product.specifications && Object.keys(product.specifications).length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900">Specifications</h3>
              <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {Object.entries(product.specifications).map(([key, value]) => (
                  <div key={key}>
                    <dt className="text-sm font-medium text-gray-500">{key}</dt>
                    <dd className="text-sm text-gray-900">{String(value)}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="mt-6">
            <div className="flex items-center space-x-4">
              <label htmlFor="quantity" className="text-sm font-medium text-gray-900">
                Quantity:
              </label>
              <select
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="rounded-md border border-gray-300 py-1.5 px-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {[...Array(Math.min(10, product.stockQuantity))].map((_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>
              <span className="text-sm text-gray-500">
                ({product.stockQuantity} in stock)
              </span>
            </div>
          </div>

          <div className="mt-8 flex space-x-4">
            <button
              onClick={addToCart}
              disabled={cartLoading || product.stockQuantity === 0}
              className="flex-1 bg-green-600 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cartLoading ? 'Adding...' : 'Add to Cart'}
            </button>
            <button
              onClick={buyNow}
              disabled={cartLoading || product.stockQuantity === 0}
              className="flex-1 bg-green-800 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Buy Now
            </button>
          </div>

          {product.stockQuantity === 0 && (
            <p className="mt-4 text-sm text-red-600 font-medium">This item is currently out of stock.</p>
          )}
        </div>
      </div>

      {/* Reviews Section */}
      <div className="mt-12">
        <h3 className="text-lg font-medium text-gray-900">Customer Reviews</h3>
        {reviews.length > 0 ? (
          <div className="mt-6 space-y-6">
            {reviews.map((review) => (
              <div key={review.id} className="border-b border-gray-200 pb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {[0, 1, 2, 3, 4].map((rating) => (
                      <span
                        key={rating}
                        className={`text-sm ${rating < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      >
                        ⭐
                      </span>
                    ))}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {(review as any).profiles?.full_name || 'Anonymous'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm text-gray-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm text-gray-500">No reviews yet. Be the first to review this product!</p>
        )}
      </div>
    </div>
  )
}