export type PriceRecord = {
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
  trend?: 'up' | 'down' | 'stable'
}

const DATA_GOV_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070'
const CEDA_AGMARKNET_URL =
  'https://agmarknet.ceda.ashoka.edu.in/api/prices'

function normaliseDate(input: unknown): string {
  if (!input) return new Date().toISOString().split('T')[0]
  const s = String(input).trim()
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return iso[0]
  const parsed = new Date(s)
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0]
  return new Date().toISOString().split('T')[0]
}

function isValidRecord(record: any): boolean {
  const modal = parseFloat(record.modal_price ?? record.price ?? '0')
  return Number.isFinite(modal) && modal > 0
}

function parseDataGovRecord(record: any, commodity: string, index: number): PriceRecord {
  const modal = parseFloat(record.modal_price) || parseFloat(record.price) || 0
  const min = parseFloat(record.min_price) || modal * 0.92
  const max = parseFloat(record.max_price) || modal * 1.08
  return {
    id: `agmarknet-${Date.now()}-${index}`,
    commodity: record.commodity || commodity,
    variety: record.variety || 'Common',
    market: record.market || record.market_name || 'Market',
    state: record.state || 'India',
    district: record.district || 'Multiple Districts',
    minPrice: Math.round(min),
    maxPrice: Math.round(max),
    modalPrice: Math.round(modal),
    unit: record.unit || 'Quintal',
    date: normaliseDate(record.arrival_date || record.price_date || record.date),
    source: 'AGMARKNET · data.gov.in',
    trend: 'stable',
  }
}

function getApiKey() {
  return (
    process.env.DATA_GOV_IN_API_KEY ||
    process.env.NEXT_PUBLIC_DATA_GOV_IN_API_KEY ||
    '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b'
  )
}

async function jsonFetch(url: string, attempts = 3): Promise<any | null> {
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'FarmCon-Agricultural-Platform',
          Accept: 'application/json',
        },
        next: { revalidate: 3600 },
      })
      if (res.ok) {
        const data = await res.json()
        return data
      }
      console.warn(
        `[market-prices] fetch ${res.status} for ${url.replace(/api-key=[^&]+/, 'api-key=***')}`,
      )
    } catch (err) {
      console.warn(`[market-prices] fetch error attempt ${i}:`, err)
    }
    await new Promise((r) => setTimeout(r, 500 * i))
  }
  return null
}

export async function fromDataGov(
  commodity: string,
  state: string | null,
  district: string | null,
  limit: number,
): Promise<PriceRecord[]> {
  const apiKey = getApiKey()

  const buildUrl = () => {
    const u = new URL(DATA_GOV_URL)
    u.searchParams.set('api-key', apiKey)
    u.searchParams.set('format', 'json')
    u.searchParams.set('limit', String(limit * 2))
    if (commodity) u.searchParams.set('filters[commodity]', commodity)
    if (state) u.searchParams.set('filters[state]', state)
    if (district) u.searchParams.set('filters[district]', district)
    return u.toString()
  }

  const data = await jsonFetch(buildUrl())
  const records = Array.isArray(data?.records) ? data.records : []
  console.log(
    `[market-prices] data.gov.in filters={commodity:${commodity}, state:${state}, district:${district}} → ${records.length} raw records`,
  )
  if (records.length === 0) return []

  const filtered = records.filter(isValidRecord)
  const source = filtered.length > 0 ? filtered : records
  return source
    .slice(0, limit)
    .map((r: any, i: number) => parseDataGovRecord(r, commodity, i))
}

export async function fromCeda(
  commodity: string,
  state: string | null,
  limit: number,
): Promise<PriceRecord[]> {
  try {
    const u = new URL(CEDA_AGMARKNET_URL)
    u.searchParams.set('commodity', commodity)
    if (state) u.searchParams.set('state', state)
    u.searchParams.set('limit', String(limit))

    const data = await jsonFetch(u.toString(), 1)
    const records: any[] = data?.data || data?.records || data || []
    if (!Array.isArray(records) || records.length === 0) return []

    return records
      .filter((r) => {
        const modal = parseFloat(r.modal_price ?? r.modalPrice ?? r.price ?? '0')
        return Number.isFinite(modal) && modal > 0
      })
      .slice(0, limit)
      .map((r, i) => {
        const modal = parseFloat(r.modal_price ?? r.modalPrice ?? r.price ?? '0')
        const min = parseFloat(r.min_price ?? r.minPrice ?? (modal * 0.92).toString())
        const max = parseFloat(r.max_price ?? r.maxPrice ?? (modal * 1.08).toString())
        return {
          id: `ceda-${Date.now()}-${i}`,
          commodity: r.commodity || commodity,
          variety: r.variety || 'Common',
          market: r.market || r.market_name || 'Market',
          state: r.state || 'India',
          district: r.district || 'Multiple Districts',
          minPrice: Math.round(min),
          maxPrice: Math.round(max),
          modalPrice: Math.round(modal),
          unit: r.unit || 'Quintal',
          date: normaliseDate(r.arrival_date || r.date),
          source: 'AGMARKNET · CEDA',
          trend: 'stable' as const,
        }
      })
  } catch {
    return []
  }
}

export async function getMarketPricesWithFallback(
  commodity: string,
  state: string | null,
  district: string | null,
  limit: number,
): Promise<PriceRecord[]> {
  const primary = await fromDataGov(commodity, state, district, limit)
  if (primary.length > 0) return primary

  const backup = await fromCeda(commodity, state, limit)
  if (backup.length > 0) return backup

  return []
}

export type VarietySummary = {
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

export function groupByVariety(
  prices: PriceRecord[],
  commodity: string,
): VarietySummary[] {
  if (prices.length === 0) return []

  const buckets = new Map<string, PriceRecord[]>()
  for (const p of prices) {
    const key = (p.variety || 'Common').trim() || 'Common'
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key)!.push(p)
  }

  const summaries: VarietySummary[] = []
  for (const [variety, records] of buckets) {
    const states = Array.from(new Set(records.map((r) => r.state).filter(Boolean)))
    const modalAvg = Math.round(
      records.reduce((s, r) => s + r.modalPrice, 0) / records.length,
    )
    const minP = Math.min(...records.map((r) => r.minPrice))
    const maxP = Math.max(...records.map((r) => r.maxPrice))
    const latestDate = records
      .map((r) => r.date)
      .sort()
      .at(-1) || records[0].date

    const topMarkets = [...records]
      .sort((a, b) => b.modalPrice - a.modalPrice)
      .slice(0, 5)
      .map((r) => ({ market: r.market, state: r.state, price: r.modalPrice }))

    summaries.push({
      variety,
      commodity: records[0]?.commodity || commodity,
      marketCount: records.length,
      stateCount: states.length,
      states,
      avgPrice: modalAvg,
      minPrice: Math.round(minP),
      maxPrice: Math.round(maxP),
      modalPrice: modalAvg,
      latestDate,
      topMarkets,
      unit: records[0]?.unit || 'Quintal',
    })
  }

  summaries.sort((a, b) => b.marketCount - a.marketCount)
  return summaries
}
