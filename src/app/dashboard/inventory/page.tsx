'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/hooks/useAuth'
import { productsAPI } from '@/lib/api-client'
import toast from 'react-hot-toast'

interface Product {
  id: string
  name: string
  stockQuantity: number
  unit: string
  price: number
  isActive: boolean
  brand?: string
  category: {
    name: string
  }
  supplier: {
    fullName: string
  }
}

export default function InventoryPage() {
  const { user } = useAuth('supplier')
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [stockFilter, setStockFilter] = useState('all')
  const [updating, setUpdating] = useState<string | null>(null)
  const [editingStock, setEditingStock] = useState<{id: string, value: string} | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const inputRefs = useRef<{[key: string]: HTMLInputElement | null}>({})

  useEffect(() => {
    if (user) {
      loadInventory()
    }
  }, [user])

  const loadInventory = async () => {
    try {
      const productsData = await productsAPI.getProducts(user?.id)
      setProducts(productsData || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
      toast.error('Failed to load inventory')
    } finally {
      setLoading(false)
    }
  }

  const updateStock = async (productId: string, newStock: number) => {
    if (newStock < 0) {
      toast.error('Stock quantity cannot be negative')
      return
    }

    setUpdating(productId)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockQuantity: newStock })
      })

      if (response.ok) {
        setProducts(products.map(p =>
          p.id === productId ? { ...p, stockQuantity: newStock } : p
        ))
        toast.success('Stock updated successfully')
        setEditingStock(null)
      } else {
        throw new Error('Failed to update stock')
      }
    } catch (error) {
      console.error('Error updating stock:', error)
      toast.error('Failed to update stock')
    } finally {
      setUpdating(null)
    }
  }

  const handleStockEdit = (productId: string, currentStock: number) => {
    setEditingStock({ id: productId, value: currentStock.toString() })
    // Focus input after state update
    setTimeout(() => {
      const input = inputRefs.current[productId]
      if (input) {
        input.focus()
        input.select()
      }
    }, 10)
  }

  const handleStockSave = (productId: string) => {
    if (editingStock && editingStock.id === productId) {
      const newStock = parseInt(editingStock.value) || 0
      updateStock(productId, newStock)
    }
  }

  const handleStockCancel = () => {
    setEditingStock(null)
  }

  const handleKeyPress = (e: React.KeyboardEvent, productId: string) => {
    if (e.key === 'Enter') {
      handleStockSave(productId)
    } else if (e.key === 'Escape') {
      handleStockCancel()
    }
  }

  const handleDeleteProduct = async (productId: string) => {
    setUpdating(productId)
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setProducts(products.filter(p => p.id !== productId))
        toast.success('Product deleted successfully')
      } else {
        throw new Error('Failed to delete product')
      }
    } catch (error) {
      console.error('Error deleting product:', error)
      toast.error('Failed to delete product')
    } finally {
      setUpdating(null)
      setShowDeleteModal(null)
    }
  }

  const getStockStatus = (stock: number) => {
    if (stock === 0) return { status: 'out', color: 'bg-red-100 text-red-800', label: 'Out of Stock' }
    if (stock < 10) return { status: 'low', color: 'bg-yellow-100 text-yellow-800', label: 'Low Stock' }
    if (stock < 50) return { status: 'medium', color: 'bg-blue-100 text-blue-800', label: 'Medium Stock' }
    return { status: 'good', color: 'bg-green-100 text-green-800', label: 'Good Stock' }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.category.name.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStock =
      stockFilter === 'all' ||
      (stockFilter === 'out' && product.stockQuantity === 0) ||
      (stockFilter === 'low' && product.stockQuantity > 0 && product.stockQuantity < 10) ||
      (stockFilter === 'medium' && product.stockQuantity >= 10 && product.stockQuantity < 50) ||
      (stockFilter === 'good' && product.stockQuantity >= 50)

    return matchesSearch && matchesStock
  })

  const stockSummary = {
    total: products.length,
    outOfStock: products.filter(p => p.stockQuantity === 0).length,
    lowStock: products.filter(p => p.stockQuantity > 0 && p.stockQuantity < 10).length,
    mediumStock: products.filter(p => p.stockQuantity >= 10 && p.stockQuantity < 50).length,
    goodStock: products.filter(p => p.stockQuantity >= 50).length,
    totalValue: products.reduce((sum, p) => sum + (p.stockQuantity * p.price), 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Track and manage your product inventory</p>
          </div>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{stockSummary.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <span className="text-2xl">❌</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-bold text-red-600">{stockSummary.outOfStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-bold text-yellow-600">{stockSummary.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">✅</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Good Stock</p>
              <p className="text-2xl font-bold text-green-600">{stockSummary.goodStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Stock Value</p>
              <p className="text-2xl font-bold text-purple-600">₹{stockSummary.totalValue.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Inventory</label>
            <input
              type="text"
              placeholder="Search by name or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Status</option>
              <option value="good">Good Stock</option>
              <option value="medium">Medium Stock</option>
              <option value="low">Low Stock</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Stock Filter</label>
            <div className="text-sm text-gray-500">Use the status filter above to sort by stock levels</div>
          </div>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Min/Max Stock
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Restocked
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const stockInfo = getStockStatus(product.stockQuantity)
                const isEditing = editingStock && editingStock.id === product.id

                return (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        <div className="text-sm text-gray-500">{product.brand || 'No brand'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {isEditing ? (
                        <div className="flex items-center space-x-2">
                          <input
                            ref={el => { inputRefs.current[product.id] = el }}
                            type="number"
                            value={editingStock.value}
                            onChange={(e) => setEditingStock({...editingStock, value: e.target.value})}
                            onKeyDown={(e) => handleKeyPress(e, product.id)}
                            className="w-20 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-orange-500 focus:border-orange-500"
                            min="0"
                          />
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleStockSave(product.id)}
                              className="text-green-600 hover:text-green-800 text-xs"
                              disabled={updating === product.id}
                            >
                              ✓
                            </button>
                            <button
                              onClick={handleStockCancel}
                              className="text-red-600 hover:text-red-800 text-xs"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className="text-sm text-gray-900">
                            {product.stockQuantity} {product.unit}
                          </div>
                          <button
                            onClick={() => handleStockEdit(product.id, product.stockQuantity)}
                            className="text-orange-600 hover:text-orange-800 text-xs"
                            disabled={updating === product.id}
                          >
                            ✏️
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      N/A
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${stockInfo.color}`}>
                        {stockInfo.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      N/A
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Link
                        href={`/dashboard/products/${product.id}`}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </Link>
                      <Link
                        href={`/dashboard/products/${product.id}/edit`}
                        className="text-orange-600 hover:text-orange-900"
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => setShowDeleteModal(product.id)}
                        className="text-red-600 hover:text-red-900"
                        disabled={updating === product.id}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Delete Product</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this product? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteModal(null)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(showDeleteModal)}
                disabled={updating === showDeleteModal}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updating === showDeleteModal ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}