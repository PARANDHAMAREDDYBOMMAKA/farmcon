import { NextRequest, NextResponse } from 'next/server';
import {
  getMandiPrices,
  getAvailableStates,
  getDistrictsByState,
  getAvailableCommodities,
  getMarketsByDistrict,
  getCommodityPrices,
  calculateAveragePrice,
} from '@/lib/agmarknet';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const state = searchParams.get('state') || undefined;
    const district = searchParams.get('district') || undefined;
    const commodity = searchParams.get('commodity') || undefined;
    const market = searchParams.get('market') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100');

    switch (action) {
      case 'states':
        const states = await getAvailableStates();
        return NextResponse.json({ states });

      case 'districts':
        if (!state) {
          return NextResponse.json(
            { error: 'State parameter required' },
            { status: 400 }
          );
        }
        const districts = await getDistrictsByState(state);
        return NextResponse.json({ districts });

      case 'commodities':
        const commodities = await getAvailableCommodities(state);
        return NextResponse.json({ commodities });

      case 'markets':
        if (!state || !district) {
          return NextResponse.json(
            { error: 'State and district parameters required' },
            { status: 400 }
          );
        }
        const markets = await getMarketsByDistrict(state, district);
        return NextResponse.json({ markets });

      case 'commodity-prices':
        if (!commodity) {
          return NextResponse.json(
            { error: 'Commodity parameter required' },
            { status: 400 }
          );
        }
        const prices = await getCommodityPrices(commodity, state, district);
        const avgPrices = calculateAveragePrice(prices);
        return NextResponse.json({ prices, averages: avgPrices });

      case 'search':
      default:
        const data = await getMandiPrices({
          state,
          district,
          commodity,
          market,
          limit,
        });
        return NextResponse.json({ data, count: data.length });
    }
  } catch (error: any) {
    console.error('AGMARKNET API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch mandi prices' },
      { status: 500 }
    );
  }
}
