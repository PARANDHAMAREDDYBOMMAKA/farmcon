'use client'

import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface TechStack {
  name: string
  category: string
  version?: string
  confidence: number
  website?: string
}

interface CompetitorAnalysis {
  url: string
  technologies: TechStack[]
  ecommerce: TechStack[]
  analytics: TechStack[]
  cms: TechStack[]
  frameworks: TechStack[]
  hosting: TechStack[]
  insights: {
    ecommerceReadiness: number
    technologyStack: string
    performanceRating: string
    marketPosition: string
  }
  error?: string
}

interface ComparisonData {
  summary: {
    totalSitesAnalyzed: number
    avgTechnologies: number
    avgEcommerceReadiness: number
  }
  popularTechnologies: Array<{ name: string; usage: number }>
  ecommercePlatforms: Array<{ name: string; count: number }>
  recommendations: string[]
  marketInsights: {
    mostUsedStack: string
    avgPerformance: string
    marketLeader: string
  }
}

export default function CompetitorAnalysisPage() {
  const { user } = useAuth('supplier')
  const [urls, setUrls] = useState<string[]>([''])
  const [analysis, setAnalysis] = useState<CompetitorAnalysis[]>([])
  const [comparison, setComparison] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'input' | 'results' | 'comparison'>('input')

  const addUrlField = () => {
    if (urls.length < 5) {
      setUrls([...urls, ''])
    } else {
      toast.error('Maximum 5 URLs allowed in free tier')
    }
  }

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      setUrls(urls.filter((_, i) => i !== index))
    }
  }

  const updateUrl = (index: number, value: string) => {
    const newUrls = [...urls]
    newUrls[index] = value
    setUrls(newUrls)
  }

  const isValidUrl = (url: string) => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  const analyzeCompetitors = async () => {
    const validUrls = urls.filter(url => url.trim() && isValidUrl(url.trim()))

    if (validUrls.length === 0) {
      toast.error('Please enter at least one valid URL')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/competitor-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: validUrls })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const data = await response.json()
      setAnalysis(data.analysis)
      setComparison(data.comparison)
      setActiveTab('results')
      toast.success(`Analyzed ${validUrls.length} competitors successfully!`)
    } catch (error) {
      console.error('Analysis error:', error)
      toast.error('Failed to analyze competitors. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const presetCompetitors = {
    'Agricultural E-commerce': [
      'https://www.kisankonnect.com',
      'https://www.agribazaar.com',
      'https://www.bigbasket.com',
      'https://www.farmfresh.com'
    ],
    'Farm Equipment': [
      'https://www.tractorjunction.com',
      'https://www.mahindratractor.com',
      'https://www.digitaltractor.com'
    ],
    'Agricultural Supplies': [
      'https://www.bighaat.com',
      'https://www.krushikendra.com',
      'https://www.agrostar.in'
    ]
  }

  const loadPreset = (preset: string) => {
    const competitors = presetCompetitors[preset as keyof typeof presetCompetitors]
    if (competitors) {
      setUrls([...competitors, ...Array(Math.max(0, 5 - competitors.length)).fill('')])
    }
  }

  const getTechColor = (category: string) => {
    const colors: { [key: string]: string } = {
      'E-commerce': 'bg-green-100 text-green-800',
      'Analytics': 'bg-blue-100 text-blue-800',
      'CMS': 'bg-purple-100 text-purple-800',
      'Framework': 'bg-orange-100 text-orange-800',
      'JavaScript Framework': 'bg-orange-100 text-orange-800',
      'Hosting': 'bg-gray-100 text-gray-800',
      'Payment': 'bg-yellow-100 text-yellow-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100'
    if (score >= 60) return 'text-yellow-600 bg-yellow-100'
    if (score >= 40) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  return (
    <div className="space-y-6">
      {}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Competitor Analysis</h1>
            <p className="text-gray-600 mt-1">Analyze competitor technology stacks and market positioning</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              🆓 Free Tier: 5 URLs/day
            </span>
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('input')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'input'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Input URLs
            </button>
            <button
              onClick={() => setActiveTab('results')}
              disabled={analysis.length === 0}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'results'
                  ? 'border-orange-500 text-orange-600'
                  : analysis.length === 0
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Results ({analysis.length})
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              disabled={!comparison}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'comparison'
                  ? 'border-orange-500 text-orange-600'
                  : !comparison
                  ? 'border-transparent text-gray-300 cursor-not-allowed'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Comparison
            </button>
          </nav>
        </div>

        {}
        {activeTab === 'input' && (
          <div className="p-6 space-y-6">
            {}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Start - Analyze Preset Competitors</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Object.keys(presetCompetitors).map((preset) => (
                  <button
                    key={preset}
                    onClick={() => loadPreset(preset)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors text-left"
                  >
                    <h4 className="font-medium text-gray-900">{preset}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {presetCompetitors[preset as keyof typeof presetCompetitors].length} competitors
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Or Enter Custom URLs</h3>

              {}
              <div className="space-y-3">
                {urls.map((url, index) => (
                  <div key={index} className="flex space-x-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => updateUrl(index, e.target.value)}
                      placeholder={`https://competitor${index + 1}.com`}
                      className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                    {urls.length > 1 && (
                      <button
                        onClick={() => removeUrlField(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {}
              {urls.length < 5 && (
                <button
                  onClick={addUrlField}
                  className="mt-3 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  + Add Another URL
                </button>
              )}

              {}
              <div className="mt-6">
                <button
                  onClick={analyzeCompetitors}
                  disabled={loading || urls.every(url => !url.trim())}
                  className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Analyzing...</span>
                    </div>
                  ) : (
                    'Analyze Competitors'
                  )}
                </button>
              </div>

              {}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">What we analyze:</h4>
                <ul className="mt-2 text-sm text-blue-800 space-y-1">
                  <li>• E-commerce platforms and payment systems</li>
                  <li>• Content management systems (CMS)</li>
                  <li>• JavaScript frameworks and libraries</li>
                  <li>• Analytics and tracking tools</li>
                  <li>• Hosting and infrastructure</li>
                  <li>• Market positioning insights</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {}
        {activeTab === 'results' && analysis.length > 0 && (
          <div className="p-6 space-y-6">
            {analysis.map((site, index) => (
              <div key={index} className="border rounded-lg p-6">
                {site.error ? (
                  <div className="text-center py-8">
                    <span className="text-4xl block mb-2">⚠️</span>
                    <h3 className="text-lg font-medium text-gray-900">{site.url}</h3>
                    <p className="text-red-600 mt-2">{site.error}</p>
                  </div>
                ) : (
                  <>
                    {}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{site.url}</h3>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReadinessColor(site.insights.ecommerceReadiness)}`}>
                            E-commerce: {site.insights.ecommerceReadiness}%
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            Stack: {site.insights.technologyStack}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            Performance: {site.insights.performanceRating}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
                            Position: {site.insights.marketPosition}
                          </span>
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {}
                      {site.ecommerce.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">🛒 E-commerce</h4>
                          <div className="space-y-2">
                            {site.ecommerce.map((tech, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-green-50 rounded">
                                <span className="text-sm font-medium">{tech.name}</span>
                                {tech.version && (
                                  <span className="text-xs text-gray-500">v{tech.version}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {}
                      {site.frameworks.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">⚛️ Frameworks</h4>
                          <div className="space-y-2">
                            {site.frameworks.map((tech, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-orange-50 rounded">
                                <span className="text-sm font-medium">{tech.name}</span>
                                {tech.version && (
                                  <span className="text-xs text-gray-500">v{tech.version}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {}
                      {site.analytics.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">📊 Analytics</h4>
                          <div className="space-y-2">
                            {site.analytics.map((tech, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                                <span className="text-sm font-medium">{tech.name}</span>
                                <span className="text-xs text-gray-500">{tech.confidence}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {}
                      {site.cms.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">📝 CMS</h4>
                          <div className="space-y-2">
                            {site.cms.map((tech, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                                <span className="text-sm font-medium">{tech.name}</span>
                                {tech.version && (
                                  <span className="text-xs text-gray-500">v{tech.version}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {}
                      {site.hosting.length > 0 && (
                        <div>
                          <h4 className="font-medium text-gray-900 mb-3">🌐 Hosting</h4>
                          <div className="space-y-2">
                            {site.hosting.map((tech, i) => (
                              <div key={i} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium">{tech.name}</span>
                                <span className="text-xs text-gray-500">{tech.confidence}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {}
                    {site.technologies.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium text-gray-900 mb-3">All Technologies ({site.technologies.length})</h4>
                        <div className="flex flex-wrap gap-2">
                          {site.technologies.map((tech, i) => (
                            <span
                              key={i}
                              className={`px-2 py-1 rounded-full text-xs font-medium ${getTechColor(tech.category)}`}
                            >
                              {tech.name}
                              {tech.version && ` v${tech.version}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {}
        {activeTab === 'comparison' && comparison && (
          <div className="p-6 space-y-6">
            {}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🌐</span>
                  <div>
                    <p className="text-sm font-medium text-blue-600">Sites Analyzed</p>
                    <p className="text-2xl font-bold text-blue-900">{comparison.summary.totalSitesAnalyzed}</p>
                  </div>
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⚙️</span>
                  <div>
                    <p className="text-sm font-medium text-green-600">Avg Technologies</p>
                    <p className="text-2xl font-bold text-green-900">{comparison.summary.avgTechnologies}</p>
                  </div>
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-6">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">🛒</span>
                  <div>
                    <p className="text-sm font-medium text-orange-600">Avg E-commerce Readiness</p>
                    <p className="text-2xl font-bold text-orange-900">{comparison.summary.avgEcommerceReadiness}%</p>
                  </div>
                </div>
              </div>
            </div>

            {}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Technologies</h3>
                <div className="space-y-3">
                  {comparison.popularTechnologies.map((tech, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{tech.name}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-orange-500 h-2 rounded-full"
                            style={{ width: `${(tech.usage / comparison.summary.totalSitesAnalyzed) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{tech.usage}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">E-commerce Platforms</h3>
                <div className="space-y-3">
                  {comparison.ecommercePlatforms.map((platform, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="font-medium">{platform.name}</span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                        {platform.count} sites
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Market Insights</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-600">Most Used Stack</p>
                  <p className="text-lg font-semibold text-gray-900">{comparison.marketInsights.mostUsedStack}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Performance</p>
                  <p className="text-lg font-semibold text-gray-900">{comparison.marketInsights.avgPerformance}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Market Leader</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {comparison.marketInsights.marketLeader === 'None identified'
                      ? 'No clear leader'
                      : comparison.marketInsights.marketLeader}
                  </p>
                </div>
              </div>
            </div>

            {}
            <div className="border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recommendations for Your Platform</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {comparison.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                    <span className="text-blue-500 mt-0.5">💡</span>
                    <p className="text-sm text-blue-900">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}