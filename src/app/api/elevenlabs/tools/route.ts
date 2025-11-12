import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ElevenLabs Tool API Endpoint
 * This endpoint handles tool calls from the ElevenLabs conversational AI agent
 * It provides access to FarmCon application data based on the tool being called
 */

interface ToolRequest {
  tool_name: string;
  parameters: {
    query?: string;
    category?: string;
    limit?: number;
    page_context?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ToolRequest;
    const { tool_name, parameters } = body;

    console.log('🔧 ElevenLabs tool called:', tool_name, parameters);

    // Route to appropriate handler based on tool name
    switch (tool_name) {
      case 'search_products':
        return await searchProducts(parameters);

      case 'search_crops':
        return await searchCrops(parameters);

      case 'search_equipment':
        return await searchEquipment(parameters);

      case 'get_application_context':
        return await getApplicationContext(parameters);

      case 'get_market_info':
        return await getMarketInfo(parameters);

      default:
        return NextResponse.json(
          { error: `Unknown tool: ${tool_name}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('❌ ElevenLabs tool API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing the tool request' },
      { status: 500 }
    );
  }
}

/**
 * Search for agricultural products (seeds, fertilizers, pesticides, tools)
 */
async function searchProducts(parameters: ToolRequest['parameters']) {
  try {
    const { search } = await import('@/lib/meilisearch');
    const query = parameters.query || '';
    const limit = parameters.limit || 10;

    console.log('🔍 Searching products:', query);
    const results = await search('products', query, { limit });

    const products = results.hits?.map((hit: any) => ({
      name: hit.name,
      description: hit.description,
      price: hit.price ? `₹${hit.price}` : 'N/A',
      category: hit.category,
      status: hit.status,
      stock: hit.stock
    })) || [];

    return NextResponse.json({
      success: true,
      tool: 'search_products',
      data: {
        query,
        results_count: products.length,
        products
      },
      message: products.length > 0
        ? `Found ${products.length} products matching "${query}"`
        : `No products found for "${query}"`
    });
  } catch (error) {
    console.error('❌ Search products error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search products',
      data: { products: [] }
    });
  }
}

/**
 * Search for crop information
 */
async function searchCrops(parameters: ToolRequest['parameters']) {
  try {
    const { search } = await import('@/lib/meilisearch');
    const query = parameters.query || '';
    const limit = parameters.limit || 10;

    console.log('🔍 Searching crops:', query);
    const results = await search('crops', query, { limit });

    const crops = results.hits?.map((hit: any) => ({
      name: hit.name,
      description: hit.description,
      status: hit.status,
      planting_date: hit.plantingDate,
      expected_harvest: hit.expectedHarvest,
      area: hit.area
    })) || [];

    return NextResponse.json({
      success: true,
      tool: 'search_crops',
      data: {
        query,
        results_count: crops.length,
        crops
      },
      message: crops.length > 0
        ? `Found ${crops.length} crops matching "${query}"`
        : `No crops found for "${query}"`
    });
  } catch (error) {
    console.error('❌ Search crops error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search crops',
      data: { crops: [] }
    });
  }
}

/**
 * Search for equipment rental information
 */
async function searchEquipment(parameters: ToolRequest['parameters']) {
  try {
    const { search } = await import('@/lib/meilisearch');
    const query = parameters.query || '';
    const limit = parameters.limit || 10;

    console.log('🔍 Searching equipment:', query);
    const results = await search('equipment', query, { limit });

    const equipment = results.hits?.map((hit: any) => ({
      name: hit.name,
      description: hit.description,
      type: hit.type,
      hourly_rate: hit.hourlyRate ? `₹${hit.hourlyRate}/hr` : 'N/A',
      daily_rate: hit.dailyRate ? `₹${hit.dailyRate}/day` : 'N/A',
      status: hit.status,
      availability: hit.available
    })) || [];

    return NextResponse.json({
      success: true,
      tool: 'search_equipment',
      data: {
        query,
        results_count: equipment.length,
        equipment
      },
      message: equipment.length > 0
        ? `Found ${equipment.length} equipment items matching "${query}"`
        : `No equipment found for "${query}"`
    });
  } catch (error) {
    console.error('❌ Search equipment error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to search equipment',
      data: { equipment: [] }
    });
  }
}

/**
 * Get general application context and capabilities
 */
async function getApplicationContext(parameters: ToolRequest['parameters']) {
  const context = parameters.page_context || '/';

  let pageInfo = {
    current_page: context,
    description: 'FarmCon Platform',
    available_features: []
  };

  // Provide context based on current page
  if (context.includes('/dashboard/supplies') || context.includes('supplies')) {
    pageInfo = {
      current_page: 'Agricultural Supplies',
      description: 'Browse and purchase seeds, fertilizers, pesticides, and farming tools',
      available_features: ['search products', 'view product details', 'add to cart', 'place orders']
    };
  } else if (context.includes('/dashboard/crops')) {
    pageInfo = {
      current_page: 'Crop Management',
      description: 'Track your crops, planting schedules, and harvest predictions',
      available_features: ['view crops', 'add new crops', 'track growth', 'harvest planning']
    };
  } else if (context.includes('/dashboard/equipment')) {
    pageInfo = {
      current_page: 'Equipment Rental',
      description: 'Rent tractors, harvesters, and other farming equipment',
      available_features: ['browse equipment', 'check availability', 'book rentals', 'view rates']
    };
  } else if (context.includes('/dashboard/market')) {
    pageInfo = {
      current_page: 'Market Prices',
      description: 'View current market prices and sell directly to consumers',
      available_features: ['check prices', 'list products', 'direct selling', 'price trends']
    };
  } else if (context.includes('/dashboard/orders')) {
    pageInfo = {
      current_page: 'Order Management',
      description: 'Track your orders and manage deliveries',
      available_features: ['view orders', 'track delivery', 'order history', 'invoice download']
    };
  } else if (context.includes('/dashboard/weather')) {
    pageInfo = {
      current_page: 'Weather Information',
      description: 'Get weather forecasts and farming recommendations',
      available_features: ['weather forecast', 'irrigation advice', 'seasonal planning', 'alerts']
    };
  } else if (context.includes('/dashboard')) {
    pageInfo = {
      current_page: 'Dashboard',
      description: 'Main control center for all FarmCon features',
      available_features: ['crop management', 'supplies', 'equipment rental', 'market', 'orders', 'weather']
    };
  }

  return NextResponse.json({
    success: true,
    tool: 'get_application_context',
    data: {
      application: 'FarmCon - Smart Farming Platform for Indian Farmers',
      version: '1.0.0',
      page_info: pageInfo,
      capabilities: [
        'Search and order agricultural supplies',
        'Manage crop lifecycles and harvest planning',
        'Rent farming equipment',
        'Access real-time market prices',
        'Track orders and deliveries',
        'Get weather forecasts and farming advice'
      ]
    },
    message: `You are currently on the ${pageInfo.current_page} page`
  });
}

/**
 * Get market information and pricing
 */
async function getMarketInfo(parameters: ToolRequest['parameters']) {
  // For now, return general market information
  // You can integrate this with your actual market data API
  return NextResponse.json({
    success: true,
    tool: 'get_market_info',
    data: {
      message: 'Market information is available on the Market page',
      features: [
        'Real-time crop prices',
        'Market trends and analysis',
        'Direct-to-consumer selling platform',
        'Price comparison tools'
      ],
      note: 'Users can list their crops for sale and view current market rates'
    }
  });
}
