import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * @swagger
 * /api/ai/price-prediction:
 *   post:
 *     summary: Get AI-powered price predictions
 *     description: |
 *       Uses historical market price data and AI to predict future prices for agricultural commodities.
 *       Provides predictions for the next 7, 15, and 30 days with confidence scores and trend analysis.
 *     tags: [AI]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - commodity
 *             properties:
 *               commodity:
 *                 type: string
 *                 description: Name of the agricultural commodity
 *                 example: Rice
 *               state:
 *                 type: string
 *                 description: State name for location-specific predictions
 *                 example: Punjab
 *               district:
 *                 type: string
 *                 description: District name for more accurate predictions
 *                 example: Ludhiana
 *     responses:
 *       200:
 *         description: Price predictions generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PricePrediction'
 *       400:
 *         description: Missing required parameters
 *       404:
 *         description: Insufficient historical data for predictions
 *       500:
 *         description: Server error
 */
export async function POST(request: NextRequest) {
  try {
    const { commodity, state, district } = await request.json();

    if (!commodity) {
      return NextResponse.json(
        { error: 'Commodity name is required' },
        { status: 400 }
      );
    }

    // Fetch historical price data for the commodity
    const whereClause: any = {
      commodity: {
        contains: commodity,
        mode: 'insensitive',
      },
    };

    if (state) {
      whereClause.state = {
        contains: state,
        mode: 'insensitive',
      };
    }

    if (district) {
      whereClause.district = {
        contains: district,
        mode: 'insensitive',
      };
    }

    const historicalPrices = await prisma.marketPrice.findMany({
      where: whereClause,
      orderBy: {
        date: 'desc',
      },
      take: 90, // Last 90 days of data
    });

    if (historicalPrices.length < 7) {
      return NextResponse.json(
        { error: 'Insufficient historical data for price prediction. Need at least 7 days of data.' },
        { status: 404 }
      );
    }

    // Calculate current price (average of last 3 days)
    const recentPrices = historicalPrices.slice(0, 3);
    const currentPrice = recentPrices.reduce((sum, p) => sum + (p.modalPrice || p.maxPrice), 0) / recentPrices.length;

    // Generate AI-powered predictions using Groq
    const predictions = await generatePricePredictions(commodity, historicalPrices, state, district);

    // Calculate trend based on recent data
    const last7Days = historicalPrices.slice(0, 7);
    const previous7Days = historicalPrices.slice(7, 14);

    const recent7DaysAvg = last7Days.reduce((sum, p) => sum + (p.modalPrice || p.maxPrice), 0) / last7Days.length;
    const previous7DaysAvg = previous7Days.length > 0
      ? previous7Days.reduce((sum, p) => sum + (p.modalPrice || p.maxPrice), 0) / previous7Days.length
      : recent7DaysAvg;

    const priceChange = ((recent7DaysAvg - previous7DaysAvg) / previous7DaysAvg) * 100;
    const overallTrend = priceChange > 2 ? 'up' : priceChange < -2 ? 'down' : 'stable';

    return NextResponse.json({
      commodity,
      location: {
        state: state || 'All States',
        district: district || 'All Districts',
      },
      currentPrice: Math.round(currentPrice * 100) / 100,
      currency: 'INR',
      unit: 'per quintal',
      historicalDataPoints: historicalPrices.length,
      predictions,
      overallTrend,
      priceChangePercent: Math.round(priceChange * 100) / 100,
      aiInsights: predictions.aiInsights,
      lastUpdated: historicalPrices[0].date,
    });
  } catch (error) {
    console.error('Price prediction error:', error);
    return NextResponse.json(
      { error: 'Failed to generate price predictions' },
      { status: 500 }
    );
  }
}

async function generatePricePredictions(
  commodity: string,
  historicalData: any[],
  state?: string,
  district?: string
) {
  try {
    if (!process.env.GROQ_API_KEY) {
      // Fallback to simple statistical prediction if no AI available
      return generateStatisticalPredictions(historicalData);
    }

    // Prepare historical data summary for AI
    const last30Days = historicalData.slice(0, 30);
    const priceData = last30Days.map(p => ({
      date: p.date.toISOString().split('T')[0],
      price: p.modalPrice || p.maxPrice,
    }));

    const prompt = `You are an agricultural market analyst. Analyze the following historical price data for ${commodity}${state ? ` in ${state}` : ''}${district ? `, ${district}` : ''} and provide price predictions.

Historical data (last 30 days):
${JSON.stringify(priceData, null, 2)}

Current average price: ₹${priceData[0].price} per quintal

Please provide:
1. Price predictions for 7 days, 15 days, and 30 days from now
2. Confidence level (0-1) for each prediction
3. Overall trend (up/down/stable)
4. Key insights and recommendations for farmers

Format your response as JSON:
{
  "predictions": [
    {"days": 7, "price": number, "confidence": number, "trend": "up/down/stable"},
    {"days": 15, "price": number, "confidence": number, "trend": "up/down/stable"},
    {"days": 30, "price": number, "confidence": number, "trend": "up/down/stable"}
  ],
  "insights": "Your detailed analysis and farmer recommendations in 2-3 sentences"
}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are an expert agricultural economist specializing in Indian crop markets. Always respond in valid JSON format.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.3, // Lower temperature for more consistent predictions
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error, falling back to statistical predictions');
      return generateStatisticalPredictions(historicalData);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content || '';

    // Parse AI response
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);

        return {
          predictions: parsed.predictions.map((p: any) => ({
            date: new Date(Date.now() + p.days * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            daysFromNow: p.days,
            predictedPrice: Math.round(p.price * 100) / 100,
            confidence: p.confidence,
            trend: p.trend,
          })),
          aiInsights: parsed.insights,
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response, using fallback');
    }

    // Fallback to statistical predictions
    return generateStatisticalPredictions(historicalData);
  } catch (error) {
    console.error('AI prediction error:', error);
    return generateStatisticalPredictions(historicalData);
  }
}

function generateStatisticalPredictions(historicalData: any[]) {
  // Simple moving average and trend-based prediction
  const last7Days = historicalData.slice(0, 7);
  const last30Days = historicalData.slice(0, 30);

  const avg7 = last7Days.reduce((sum, p) => sum + (p.modalPrice || p.maxPrice), 0) / last7Days.length;
  const avg30 = last30Days.reduce((sum, p) => sum + (p.modalPrice || p.maxPrice), 0) / last30Days.length;

  // Calculate volatility (standard deviation)
  const variance = last30Days.reduce((sum, p) => {
    const price = p.modalPrice || p.maxPrice;
    return sum + Math.pow(price - avg30, 2);
  }, 0) / last30Days.length;
  const volatility = Math.sqrt(variance);

  // Trend factor
  const trend = (avg7 - avg30) / avg30;

  // Generate predictions with increasing uncertainty
  const predictions = [
    {
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysFromNow: 7,
      predictedPrice: Math.round((avg7 * (1 + trend * 0.5)) * 100) / 100,
      confidence: 0.75,
      trend: trend > 0.02 ? 'up' : trend < -0.02 ? 'down' : 'stable',
    },
    {
      date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysFromNow: 15,
      predictedPrice: Math.round((avg7 * (1 + trend * 1.0)) * 100) / 100,
      confidence: 0.6,
      trend: trend > 0.02 ? 'up' : trend < -0.02 ? 'down' : 'stable',
    },
    {
      date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      daysFromNow: 30,
      predictedPrice: Math.round((avg7 * (1 + trend * 1.5)) * 100) / 100,
      confidence: 0.45,
      trend: trend > 0.02 ? 'up' : trend < -0.02 ? 'down' : 'stable',
    },
  ];

  const trendDescription = trend > 0.02
    ? 'upward'
    : trend < -0.02
    ? 'downward'
    : 'stable';

  const insights = `Based on statistical analysis of the last 30 days, prices show a ${trendDescription} trend with ${volatility > avg30 * 0.1 ? 'high' : 'moderate'} volatility. ${
    trend > 0.05
      ? 'Consider selling soon to maximize profits as prices may peak.'
      : trend < -0.05
      ? 'Prices are declining. Consider holding inventory if storage permits, or sell to avoid further losses.'
      : 'Prices are stable. Good time for steady sales or strategic purchasing.'
  }`;

  return {
    predictions,
    aiInsights: insights,
  };
}
