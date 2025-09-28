'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface AnalyticsData {
  revenue: {
    monthly: number[]
    total: number
    growth: number
  }
  sales: {
    totalOrders: number
    totalQuantity: number
    averageOrderValue: number
  }
  products: {
    topSelling: Array<{
      name: string
      quantity: number
      revenue: number
    }>
    categories: Array<{
      name: string
      sales: number
      revenue: number
    }>
  }
  customers: {
    totalCustomers: number
    repeatCustomers: number
    newCustomers: number
  }
}

export default function AnalyticsPage() {
  const { user } = useAuth('supplier')
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('last-30-days')

  useEffect(() => {
    if (user) {
      loadAnalytics()
    }
  }, [user, dateRange])

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?supplierId=${user?.id}&range=${dateRange}`)
      const data = await response.json()
      if (data.analytics) {
        setAnalytics(data.analytics)
      } else {
        // Mock data for demonstration
        setAnalytics({
          revenue: {
            monthly: [25000, 32000, 28000, 45000, 38000, 52000],
            total: 220000,
            growth: 12.5
          },
          sales: {
            totalOrders: 145,
            totalQuantity: 2850,
            averageOrderValue: 1517
          },
          products: {
            topSelling: [
              { name: 'Organic Seeds - Tomato', quantity: 85, revenue: 21250 },
              { name: 'NPK Fertilizer 20-20-20', quantity: 45, revenue: 38250 },
              { name: 'Drip Irrigation Kit', quantity: 25, revenue: 30000 },
              { name: 'Organic Compost', quantity: 120, revenue: 18000 },
              { name: 'Insecticide Spray', quantity: 65, revenue: 20800 }
            ],
            categories: [
              { name: 'Fertilizers', sales: 165, revenue: 56250 },
              { name: 'Seeds', sales: 85, revenue: 21250 },
              { name: 'Equipment', sales: 25, revenue: 30000 },
              { name: 'Pesticides', sales: 65, revenue: 20800 }
            ]
          },
          customers: {
            totalCustomers: 85,
            repeatCustomers: 32,
            newCustomers: 53
          }
        })
      }
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <span className="text-6xl block mb-4">📊</span>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No analytics data available</h3>
        <p className="text-gray-600">Analytics will appear here once you have sales data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
            <p className="text-gray-600 mt-1">Track your business performance and insights</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="last-7-days">Last 7 Days</option>
              <option value="last-30-days">Last 30 Days</option>
              <option value="last-90-days">Last 90 Days</option>
              <option value="last-year">Last Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <span className="text-2xl">💰</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.revenue.total.toLocaleString()}</p>
              <p className={`text-xs ${analytics.revenue.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {analytics.revenue.growth >= 0 ? '+' : ''}{analytics.revenue.growth}% vs last month
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <span className="text-2xl">📦</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.sales.totalOrders}</p>
              <p className="text-xs text-gray-500">{analytics.sales.totalQuantity} items sold</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <span className="text-2xl">💳</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
              <p className="text-2xl font-bold text-gray-900">₹{analytics.sales.averageOrderValue.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Per order</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <span className="text-2xl">👥</span>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Customers</p>
              <p className="text-2xl font-bold text-gray-900">{analytics.customers.totalCustomers}</p>
              <p className="text-xs text-gray-500">{analytics.customers.newCustomers} new this month</p>
            </div>
          </div>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trend</h3>
        <div className="h-64 flex items-end space-x-2">
          {analytics.revenue.monthly.map((revenue, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full bg-orange-500 rounded-t-sm"
                style={{
                  height: `${(revenue / Math.max(...analytics.revenue.monthly)) * 200}px`
                }}
              />
              <span className="text-xs text-gray-500 mt-2">{months[index]}</span>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            Revenue ranges from ₹{Math.min(...analytics.revenue.monthly).toLocaleString()} to ₹{Math.max(...analytics.revenue.monthly).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Top Products and Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
          <div className="space-y-4">
            {analytics.products.topSelling.map((product, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-orange-600">#{index + 1}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{product.name}</p>
                    <p className="text-xs text-gray-500">{product.quantity} units sold</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">₹{product.revenue.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Categories Performance */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Performance</h3>
          <div className="space-y-4">
            {analytics.products.categories.map((category, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-900">{category.name}</span>
                  <span className="text-sm text-gray-600">₹{category.revenue.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full"
                    style={{
                      width: `${(category.revenue / Math.max(...analytics.products.categories.map(c => c.revenue))) * 100}%`
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500">{category.sales} sales</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Customer Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">👥</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics.customers.totalCustomers}</p>
            <p className="text-sm text-gray-600">Total Customers</p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">🔄</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics.customers.repeatCustomers}</p>
            <p className="text-sm text-gray-600">Repeat Customers</p>
            <p className="text-xs text-gray-500">
              {((analytics.customers.repeatCustomers / analytics.customers.totalCustomers) * 100).toFixed(1)}% retention rate
            </p>
          </div>
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <span className="text-2xl">✨</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics.customers.newCustomers}</p>
            <p className="text-sm text-gray-600">New Customers</p>
            <p className="text-xs text-gray-500">This month</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="mr-2">📊</span>
            <span className="text-sm font-medium">Sales Report</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="mr-2">📈</span>
            <span className="text-sm font-medium">Revenue Report</span>
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <span className="mr-2">👥</span>
            <span className="text-sm font-medium">Customer Report</span>
          </button>
        </div>
      </div>
    </div>
  )
}