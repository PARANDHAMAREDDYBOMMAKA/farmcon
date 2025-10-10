/**
 * AGMARKNET API Client
 * Government of India's Agricultural Marketing Information Network
 * Provides real-time mandi (market) prices for agricultural commodities
 *
 * API: 100% FREE - No registration required
 * Data: 3000+ markets across India
 */

const API_KEY = '579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b';
const BASE_URL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';

export interface MandiPrice {
  state: string;
  district: string;
  market: string;
  commodity: string;
  variety: string;
  grade: string;
  min_price: string;
  max_price: string;
  modal_price: string;
  price_date: string;
  arrival_date: string;
}

export interface AgmarknetResponse {
  records: MandiPrice[];
  total: number;
  count: number;
  limit: number;
  offset: number;
}

/**
 * Fetch mandi prices with optional filters
 */
export async function getMandiPrices(params?: {
  state?: string;
  district?: string;
  commodity?: string;
  market?: string;
  limit?: number;
  offset?: number;
}): Promise<MandiPrice[]> {
  try {
    const url = new URL(BASE_URL);
    url.searchParams.set('api-key', API_KEY);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', (params?.limit || 100).toString());
    url.searchParams.set('offset', (params?.offset || 0).toString());

    // Add filters if provided
    if (params?.state) {
      url.searchParams.set('filters[state]', params.state);
    }
    if (params?.district) {
      url.searchParams.set('filters[district]', params.district);
    }
    if (params?.commodity) {
      url.searchParams.set('filters[commodity]', params.commodity);
    }
    if (params?.market) {
      url.searchParams.set('filters[market]', params.market);
    }

    const response = await fetch(url.toString(), {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`AGMARKNET API error: ${response.statusText}`);
    }

    const data: AgmarknetResponse = await response.json();
    return data.records || [];
  } catch (error) {
    console.error('Error fetching AGMARKNET data:', error);
    return [];
  }
}

/**
 * Get all available states
 */
export async function getAvailableStates(): Promise<string[]> {
  try {
    const data = await getMandiPrices({ limit: 1000 });
    const states = [...new Set(data.map(record => record.state))];
    return states.sort();
  } catch (error) {
    console.error('Error fetching states:', error);
    return [];
  }
}

/**
 * Get districts for a specific state
 */
export async function getDistrictsByState(state: string): Promise<string[]> {
  try {
    const data = await getMandiPrices({ state, limit: 1000 });
    const districts = [...new Set(data.map(record => record.district))];
    return districts.sort();
  } catch (error) {
    console.error('Error fetching districts:', error);
    return [];
  }
}

/**
 * Get all available commodities
 */
export async function getAvailableCommodities(state?: string): Promise<string[]> {
  try {
    const data = await getMandiPrices({ state, limit: 1000 });
    const commodities = [...new Set(data.map(record => record.commodity))];
    return commodities.sort();
  } catch (error) {
    console.error('Error fetching commodities:', error);
    return [];
  }
}

/**
 * Get markets for a specific district
 */
export async function getMarketsByDistrict(state: string, district: string): Promise<string[]> {
  try {
    const data = await getMandiPrices({ state, district, limit: 1000 });
    const markets = [...new Set(data.map(record => record.market))];
    return markets.sort();
  } catch (error) {
    console.error('Error fetching markets:', error);
    return [];
  }
}

/**
 * Get latest prices for a specific commodity
 */
export async function getCommodityPrices(
  commodity: string,
  state?: string,
  district?: string
): Promise<MandiPrice[]> {
  return getMandiPrices({ commodity, state, district, limit: 50 });
}

/**
 * Calculate average price for a commodity across markets
 */
export function calculateAveragePrice(prices: MandiPrice[]): {
  avgMinPrice: number;
  avgMaxPrice: number;
  avgModalPrice: number;
} {
  if (prices.length === 0) {
    return { avgMinPrice: 0, avgMaxPrice: 0, avgModalPrice: 0 };
  }

  const sum = prices.reduce(
    (acc, price) => ({
      min: acc.min + parseFloat(price.min_price || '0'),
      max: acc.max + parseFloat(price.max_price || '0'),
      modal: acc.modal + parseFloat(price.modal_price || '0'),
    }),
    { min: 0, max: 0, modal: 0 }
  );

  return {
    avgMinPrice: Math.round(sum.min / prices.length),
    avgMaxPrice: Math.round(sum.max / prices.length),
    avgModalPrice: Math.round(sum.modal / prices.length),
  };
}
