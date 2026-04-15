'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import dynamic from 'next/dynamic'
import { TrendingUp, TrendingDown, ArrowRight, BadgeCheck, RefreshCw, Wheat, MapPin, Building2, Search, DollarSign, BarChart3, Store, Lightbulb, Trophy, Zap, Package, Smartphone, MousePointer } from 'lucide-react'

const PriceChart = dynamic(() => import('@/components/charts/PriceChart'), { ssr: false })
const MarketComparisonChart = dynamic(() => import('@/components/charts/MarketComparisonChart'), { ssr: false })

interface MarketPrice {
  id: string
  commodity: string
  variety?: string
  market: string
  state: string
  district: string
  minPrice: number
  maxPrice: number
  modalPrice: number
  unit: string
  date: string
  source: string
  priceChange?: number
  trend?: 'up' | 'down' | 'stable'
}

interface MarketInsights {
  avgPrice: number
  priceRange: { min: number; max: number }
  bestMarkets: Array<{ market: string; price: number; state: string }>
  worstMarkets: Array<{ market: string; price: number; state: string }>
  seasonalTrend: string
  recommendation: string
}

interface HistoricalData {
  months: Array<{
    month: string
    price: number
    volume: number
    trend: string
  }>
  avgPrice: number
  priceVolatility: string
  harvestSeason: string
  bestSellingMonth: string
}

interface VarietySummary {
  variety: string
  commodity: string
  marketCount: number
  stateCount: number
  states: string[]
  avgPrice: number
  minPrice: number
  maxPrice: number
  modalPrice: number
  latestDate: string
  topMarkets: { market: string; state: string; price: number }[]
  unit: string
}

interface MarketData {
  prices: MarketPrice[]
  varieties: VarietySummary[]
  insights: MarketInsights
  historical: HistoricalData
  commodity: string
  state: string | null
  district: string | null
  totalRecords: number
  lastUpdated: string
  source: string
}

function aggregateByVariety(prices: MarketPrice[]): VarietySummary[] {
  if (!prices || prices.length === 0) return []
  const buckets = new Map<string, MarketPrice[]>()
  for (const p of prices) {
    const key = (p.variety || 'Common').trim() || 'Common'
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(p)
  }
  const out: VarietySummary[] = []
  for (const [variety, records] of buckets) {
    const states = Array.from(new Set(records.map((r) => r.state).filter(Boolean)))
    const avg = Math.round(records.reduce((s, r) => s + r.modalPrice, 0) / records.length)
    const minP = Math.min(...records.map((r) => r.minPrice))
    const maxP = Math.max(...records.map((r) => r.maxPrice))
    const latest = records.map((r) => r.date).sort().at(-1) || records[0].date
    const top = [...records]
      .sort((a, b) => b.modalPrice - a.modalPrice)
      .slice(0, 5)
      .map((r) => ({ market: r.market, state: r.state, price: r.modalPrice }))
    out.push({
      variety,
      commodity: records[0].commodity,
      marketCount: records.length,
      stateCount: states.length,
      states,
      avgPrice: avg,
      minPrice: Math.round(minP),
      maxPrice: Math.round(maxP),
      modalPrice: avg,
      latestDate: latest,
      topMarkets: top,
      unit: records[0].unit || 'Quintal',
    })
  }
  out.sort((a, b) => b.marketCount - a.marketCount)
  return out
}

export default function MarketPricesPage() {
  const { user } = useAuth()
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [commodity, setCommodity] = useState('Rice')
  const [state, setState] = useState('')
  const [district, setDistrict] = useState('')
  const [activeTab, setActiveTab] = useState<'current' | 'historical' | 'insights'>('current')

  const [dataCache, setDataCache] = useState<Map<string, MarketData>>(new Map())

  const commodities = [
    'Rice', 'Wheat', 'Sugarcane', 'Cotton', 'Onion', 'Potato', 'Tomato',
    'Maize', 'Soybean', 'Groundnut', 'Mustard', 'Sunflower', 'Bajra', 'Jowar'
  ]

  const states = [
    'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Punjab', 'Rajasthan', 'Tamil Nadu',
    'Telangana', 'Uttar Pradesh', 'West Bengal'
  ]

  useEffect(() => {
    loadMarketData()
  }, [])

  const loadMarketData = async () => {
    setLoading(true)
    try {
      
      const cacheKey = `${commodity}-${state}-${district}`

      if (dataCache.has(cacheKey)) {
        console.log('Using client-side cached data')
        setMarketData(dataCache.get(cacheKey)!)
        setLoading(false)
        return
      }

      let url = `/api/market-prices?commodity=${encodeURIComponent(commodity)}&limit=50`
      if (state) url += `&state=${encodeURIComponent(state)}`
      if (district) url += `&district=${encodeURIComponent(district)}`

      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setMarketData(data)

        setDataCache(prev => new Map(prev).set(cacheKey, data))

        toast.success('Market data loaded successfully')
      } else {
        toast.error('Failed to load market data')
      }
    } catch (error) {
      console.error('Market data error:', error)
      toast.error('Failed to load market data')
    } finally {
      setLoading(false)
    }
  }

  const handleCommodityChange = (newCommodity: string) => {
    setCommodity(newCommodity)
  }

  const handleStateChange = (newState: string) => {
    setState(newState)
  }

  const handleDistrictChange = (newDistrict: string) => {
    setDistrict(newDistrict)
  }

  const handleSearch = () => {
    loadMarketData()
  }

  const handleClearCache = () => {
    setDataCache(new Map())
    toast.success('Cache cleared successfully')
    loadMarketData()
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 inline" />
      case 'down': return <TrendingDown className="w-3 h-3 inline" />
      default: return <ArrowRight className="w-3 h-3 inline" />
    }
  }

  const getTrendColor = (trend?: string) => {
    switch (trend) {
      case 'up': return 'text-emerald-600 bg-emerald-100'
      case 'down': return 'text-red-600 bg-red-100'
      default: return 'text-slate-700 bg-slate-100'
    }
  }

  const getSeasonalTrendColor = (trend: string) => {
    switch (trend) {
      case 'rising': return 'text-emerald-600 bg-emerald-100'
      case 'falling': return 'text-red-600 bg-red-100'
      default: return 'text-blue-600 bg-blue-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-700">Loading market data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-700">Market Prices</h1>
            <p className="text-slate-700 mt-1">Real-time agricultural commodity prices from Indian markets</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center space-x-2">
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-sm rounded-full flex items-center gap-1">
              <BadgeCheck className="w-4 h-4" /> Government Data Source
            </span>
            {dataCache.size > 0 && (
              <button
                onClick={handleClearCache}
                className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full hover:bg-blue-200 transition-colors flex items-center gap-1"
                title="Clear cached data and refresh"
              >
                <RefreshCw className="w-4 h-4" /> Clear Cache ({dataCache.size})
              </button>
            )}
          </div>
        </div>
      </div>

      {}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-1"><Wheat className="w-4 h-4" /> Commodity</label>
            <select
              value={commodity}
              onChange={(e) => handleCommodityChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            >
              {commodities.map(crop => (
                <option key={crop} value={crop}>{crop}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-1"><MapPin className="w-4 h-4" /> State (Optional)</label>
            <select
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            >
              <option value="">All States</option>
              {states.map(stateName => (
                <option key={stateName} value={stateName}>{stateName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2 flex items-center gap-1"><Building2 className="w-4 h-4" /> District (Optional)</label>
            <input
              type="text"
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter district name"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={loading}
              className="w-full px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white rounded-lg hover:from-emerald-700 hover:to-emerald-800 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-200 text-sm font-medium"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Loading...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <Search className="w-4 h-4" />
                  <span>Search Markets</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>

      {marketData && (
        <>
          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-emerald-100 rounded-lg flex-shrink-0">
                  <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-700">Average Price</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-700 truncate">₹{marketData.insights.avgPrice.toLocaleString()}</p>
                  <p className="text-xs text-slate-700">per {marketData.prices[0]?.unit || 'Quintal'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                  <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-700">Price Range</p>
                  <p className="text-sm sm:text-lg font-bold text-slate-700 truncate">
                    ₹{marketData.insights.priceRange.min} - ₹{marketData.insights.priceRange.max}
                  </p>
                  <p className="text-xs text-slate-700">Min - Max</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg flex-shrink-0">
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-700">Market Trend</p>
                  <p className={`text-sm sm:text-lg font-bold px-2 py-1 rounded capitalize ${getSeasonalTrendColor(marketData.insights.seasonalTrend)}`}>
                    {marketData.insights.seasonalTrend}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <Store className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-700">Markets</p>
                  <p className="text-lg sm:text-2xl font-bold text-slate-700">{marketData.totalRecords}</p>
                  <p className="text-xs text-slate-700">Data points</p>
                </div>
              </div>
            </div>
          </div>

          {}
          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-slate-200 overflow-x-auto">
              <nav className="-mb-px flex space-x-4 sm:space-x-8 px-4 sm:px-6 min-w-max sm:min-w-0">
                <button
                  onClick={() => setActiveTab('current')}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === 'current'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-700 hover:text-slate-600 hover:border-slate-200'
                  }`}
                >
                  Varieties ({marketData.varieties?.length || 0})
                </button>
                <button
                  onClick={() => setActiveTab('historical')}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === 'historical'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-700 hover:text-slate-600 hover:border-slate-200'
                  }`}
                >
                  Historical Trends
                </button>
                <button
                  onClick={() => setActiveTab('insights')}
                  className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                    activeTab === 'insights'
                      ? 'border-emerald-500 text-emerald-600'
                      : 'border-transparent text-slate-700 hover:text-slate-600 hover:border-slate-200'
                  }`}
                >
                  Market Insights
                </button>
              </nav>
            </div>

            {}
            {activeTab === 'current' && (
              <div className="p-3 sm:p-6 space-y-4">
                {(() => {
                  const varieties: VarietySummary[] =
                    marketData.varieties && marketData.varieties.length > 0
                      ? marketData.varieties
                      : aggregateByVariety(marketData.prices)
                  return varieties
                })().length === 0 ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-20 h-20 text-emerald-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-emerald-950 mb-1">No varieties found</h3>
                    <p className="text-sm text-slate-600">Try a different commodity or change filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(marketData.varieties && marketData.varieties.length > 0
                      ? marketData.varieties
                      : aggregateByVariety(marketData.prices)
                    ).map((v) => (
                      <div
                        key={v.variety}
                        className="group relative rounded-2xl bg-white ring-1 ring-emerald-100 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all overflow-hidden"
                      >
                        <div className="h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-3 mb-4">
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600 mb-1">
                                Variety
                              </p>
                              <h3 className="text-xl font-extrabold text-emerald-950 truncate">
                                {v.variety}
                              </h3>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {v.commodity} · per {v.unit}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Modal price
                              </p>
                              <p className="text-2xl font-extrabold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                                ₹{v.avgPrice.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-2 mb-4">
                            <div className="rounded-xl bg-emerald-50 ring-1 ring-emerald-100 p-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                                Markets
                              </p>
                              <p className="text-lg font-extrabold text-emerald-950 mt-0.5">
                                {v.marketCount}
                              </p>
                            </div>
                            <div className="rounded-xl bg-sky-50 ring-1 ring-sky-100 p-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-700">
                                States
                              </p>
                              <p className="text-lg font-extrabold text-emerald-950 mt-0.5">
                                {v.stateCount}
                              </p>
                            </div>
                            <div className="rounded-xl bg-amber-50 ring-1 ring-amber-100 p-2.5">
                              <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
                                Range
                              </p>
                              <p className="text-[11px] font-bold text-emerald-950 mt-1 leading-tight">
                                ₹{v.minPrice.toLocaleString('en-IN')} – ₹{v.maxPrice.toLocaleString('en-IN')}
                              </p>
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                Top paying markets
                              </p>
                              <p className="text-[11px] text-slate-500">
                                {new Date(v.latestDate).toLocaleDateString('en-IN', {
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </p>
                            </div>
                            <ul className="space-y-1.5">
                              {v.topMarkets.slice(0, 3).map((m, i) => (
                                <li
                                  key={`${m.market}-${m.state}-${i}`}
                                  className="flex items-center justify-between text-sm"
                                >
                                  <span className="flex items-center gap-2 min-w-0">
                                    <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold">
                                      {i + 1}
                                    </span>
                                    <span className="truncate font-semibold text-emerald-900">
                                      {m.market}
                                    </span>
                                    <span className="text-xs text-slate-500 truncate">· {m.state}</span>
                                  </span>
                                  <span className="font-bold text-emerald-800 flex-shrink-0">
                                    ₹{m.price.toLocaleString('en-IN')}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {}
            {activeTab === 'historical' && (
              <div className="p-3 sm:p-6 space-y-6">
                {}
                <div className="bg-white rounded-lg p-3 sm:p-6 border border-slate-200 overflow-hidden">
                  <div className="w-full h-80 sm:h-96">
                    <PriceChart
                      data={marketData.historical.months}
                      commodity={commodity}
                      type="line"
                      showVolume={true}
                    />
                  </div>
                </div>

                {}
                <div className="bg-emerald-50/30 rounded-lg p-4 text-center">
                  <p className="text-sm text-slate-700 mb-2 flex items-center justify-center gap-1"><BarChart3 className="w-4 h-4" /> Interactive Chart Features:</p>
                  <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-700">
                    <span className="px-2 py-1 bg-white rounded flex items-center gap-1"><MousePointer className="w-3 h-3" /> Hover for details</span>
                    <span className="px-2 py-1 bg-white rounded flex items-center gap-1"><TrendingUp className="w-3 h-3" /> Price trends</span>
                    <span className="px-2 py-1 bg-white rounded flex items-center gap-1"><Package className="w-3 h-3" /> Trading volume</span>
                    <span className="px-2 py-1 bg-white rounded flex items-center gap-1"><Smartphone className="w-3 h-3" /> Mobile responsive</span>
                  </div>
                </div>

                {}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <h4 className="font-medium text-blue-900">Average Price</h4>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">₹{marketData.historical.avgPrice.toLocaleString()}</p>
                    <p className="text-sm text-blue-600">6-month average</p>
                  </div>
                  <div className="bg-yellow-50 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <BarChart3 className="w-6 h-6 text-yellow-600" />
                    </div>
                    <h4 className="font-medium text-yellow-900">Price Volatility</h4>
                    <p className="text-xl sm:text-2xl font-bold text-yellow-600">{marketData.historical.priceVolatility}</p>
                    <p className="text-sm text-yellow-600">Market stability</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Trophy className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h4 className="font-medium text-emerald-900">Best Month</h4>
                    <p className="text-lg sm:text-lg font-bold text-emerald-600">{marketData.historical.bestSellingMonth}</p>
                    <p className="text-sm text-emerald-600">Highest prices</p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4 text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Wheat className="w-6 h-6 text-purple-600" />
                    </div>
                    <h4 className="font-medium text-purple-900">Harvest Season</h4>
                    <p className="text-sm font-medium text-purple-600">{marketData.historical.harvestSeason}</p>
                  </div>
                </div>
              </div>
            )}

            {}
            {activeTab === 'insights' && (
              <div className="p-3 sm:p-6 space-y-6">
                {}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 sm:p-6">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
                    <Lightbulb className="w-5 h-5 mr-2" />
                    Market Recommendation
                  </h3>
                  <p className="text-blue-800 leading-relaxed">{marketData.insights.recommendation}</p>
                </div>

                {}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  {}
                  <div className="border rounded-lg p-3 sm:p-6 bg-white overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-4 text-center flex items-center justify-center">
                      <Trophy className="w-5 h-5 mr-2" />
                      Best Selling Markets
                    </h3>
                    <div className="w-full">
                      <MarketComparisonChart
                        data={marketData.insights.bestMarkets.map(market => ({
                          ...market,
                          trend: Math.random() > 0.5 ? 'up' : 'stable' 
                        }))}
                        title=""
                        type="best"
                      />
                    </div>
                    <div className="mt-4 space-y-2">
                      {marketData.insights.bestMarkets.map((market, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-emerald-50 rounded text-xs sm:text-sm">
                          <span className="font-medium text-emerald-900 truncate mr-2">{market.market}</span>
                          <span className="font-bold text-emerald-600 whitespace-nowrap">₹{market.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {}
                  <div className="border rounded-lg p-3 sm:p-6 bg-white overflow-hidden">
                    <h3 className="text-base sm:text-lg font-semibold text-slate-700 mb-4 text-center flex items-center justify-center">
                      <TrendingDown className="w-5 h-5 mr-2" />
                      Lower Price Markets
                    </h3>
                    <div className="w-full">
                      <MarketComparisonChart
                        data={marketData.insights.worstMarkets.map(market => ({
                          ...market,
                          trend: Math.random() > 0.5 ? 'down' : 'stable' 
                        }))}
                        title=""
                        type="worst"
                      />
                    </div>
                    <div className="mt-4 space-y-2">
                      {marketData.insights.worstMarkets.map((market, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-red-50 rounded text-xs sm:text-sm">
                          <span className="font-medium text-red-900 truncate mr-2">{market.market}</span>
                          <span className="font-bold text-red-600 whitespace-nowrap">₹{market.price.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="text-center p-4 sm:p-6 border rounded-lg bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-emerald-200 rounded-full flex items-center justify-center mb-3">
                      <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-700" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-700">₹{marketData.insights.avgPrice.toLocaleString()}</p>
                    <p className="text-sm text-slate-700">National Average</p>
                  </div>
                  <div className="text-center p-4 sm:p-6 border rounded-lg bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-200 rounded-full flex items-center justify-center mb-3">
                      <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-blue-700" />
                    </div>
                    <p className="text-xl sm:text-2xl font-bold text-slate-700">
                      ₹{(marketData.insights.priceRange.max - marketData.insights.priceRange.min).toLocaleString()}
                    </p>
                    <p className="text-sm text-slate-700">Price Variation</p>
                  </div>
                  <div className="text-center p-4 sm:p-6 border rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 sm:col-span-2 lg:col-span-1">
                    <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-yellow-200 rounded-full flex items-center justify-center mb-3">
                      <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-700" />
                    </div>
                    <p className="text-lg sm:text-lg font-bold text-slate-700 capitalize">{marketData.insights.seasonalTrend}</p>
                    <p className="text-sm text-slate-700">Market Trend</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {}
          <div className="bg-emerald-50/30 rounded-lg p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-700">
              <div className="flex items-center gap-4">
                <div>
                  <span className="font-medium">Data Source:</span> {marketData.source}
                </div>
                {dataCache.size > 0 && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full flex items-center gap-1">
                    <Zap className="w-3 h-3" /> Cached Data ({dataCache.size} filters cached)
                  </span>
                )}
              </div>
              <div>
                <span className="font-medium">Last Updated:</span> {new Date(marketData.lastUpdated).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}