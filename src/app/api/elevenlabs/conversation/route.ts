import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ElevenLabs Conversation API Endpoint
 * This endpoint can be used by ElevenLabs agent to get conversational responses
 * with context from the FarmCon application
 */

interface ConversationRequest {
  query: string;
  context?: string;
  user_id?: string;
  session_id?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { query, context } = await request.json() as ConversationRequest;

    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    console.log('💬 ElevenLabs conversation request:', query, 'Context:', context);

    // Get relevant context from Meilisearch
    let retrievedContext = '';
    if (process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_API_KEY) {
      try {
        retrievedContext = await getRelevantContext(query, context);
      } catch (error) {
        console.error('❌ Context retrieval error:', error);
      }
    }

    // Build response with context
    const response = {
      success: true,
      query,
      context: context || '/',
      page_info: getPageInfo(context),
      relevant_data: retrievedContext,
      suggestions: getSuggestions(context),
      timestamp: new Date().toISOString()
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ ElevenLabs conversation API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    );
  }
}

/**
 * Get relevant context from Meilisearch based on user query
 */
async function getRelevantContext(userQuery: string, context?: string): Promise<string> {
  try {
    const { search } = await import('@/lib/meilisearch');

    let indexName = 'products';

    // Determine which index to search based on context
    if (context?.includes('crops')) {
      indexName = 'crops';
    } else if (context?.includes('equipment')) {
      indexName = 'equipment';
    }

    console.log(`🔎 Searching ${indexName} for: "${userQuery}"`);
    const searchResults = await search(indexName, userQuery, { limit: 5 });

    if (!searchResults.hits || searchResults.hits.length === 0) {
      return 'No specific data found in the database for this query.';
    }

    let contextText = '';

    searchResults.hits.forEach((hit: any, index: number) => {
      contextText += `${index + 1}. ${hit.name}`;
      if (hit.description) {
        contextText += ` - ${hit.description.substring(0, 150)}`;
      }
      if (hit.price) {
        contextText += ` | Price: ₹${hit.price}`;
      }
      if (hit.hourlyRate || hit.dailyRate) {
        contextText += ` | Rates: ${hit.hourlyRate ? `₹${hit.hourlyRate}/hr` : ''} ${hit.dailyRate ? `₹${hit.dailyRate}/day` : ''}`;
      }
      if (hit.status) {
        contextText += ` | Status: ${hit.status}`;
      }
      contextText += '\n';
    });

    return contextText;
  } catch (error) {
    console.error('❌ Error retrieving context:', error);
    return '';
  }
}

/**
 * Get page-specific information based on context
 */
function getPageInfo(context?: string): object {
  if (!context) return { page: 'home', description: 'FarmCon landing page' };

  if (context.includes('/dashboard/supplies')) {
    return {
      page: 'Agricultural Supplies',
      description: 'Browse seeds, fertilizers, pesticides, and farming tools',
      actions: ['search products', 'view details', 'add to cart', 'checkout']
    };
  } else if (context.includes('/dashboard/crops')) {
    return {
      page: 'Crop Management',
      description: 'Track crops, planting schedules, and harvest predictions',
      actions: ['view crops', 'add crop', 'track growth', 'harvest planning']
    };
  } else if (context.includes('/dashboard/equipment')) {
    return {
      page: 'Equipment Rental',
      description: 'Rent tractors, harvesters, and farming equipment',
      actions: ['browse equipment', 'check availability', 'book rental']
    };
  } else if (context.includes('/dashboard/market')) {
    return {
      page: 'Market Prices',
      description: 'View current market prices and sell directly',
      actions: ['check prices', 'list products', 'view trends']
    };
  } else if (context.includes('/dashboard/orders')) {
    return {
      page: 'Order Management',
      description: 'Track orders and manage deliveries',
      actions: ['view orders', 'track delivery', 'download invoice']
    };
  } else if (context.includes('/dashboard/weather')) {
    return {
      page: 'Weather Information',
      description: 'Weather forecasts and farming recommendations',
      actions: ['view forecast', 'get advice', 'irrigation planning']
    };
  } else if (context.includes('/dashboard')) {
    return {
      page: 'Dashboard',
      description: 'Main control center for FarmCon',
      actions: ['navigate features', 'view overview', 'access all modules']
    };
  }

  return { page: 'home', description: 'FarmCon Platform' };
}

/**
 * Get contextual suggestions based on current page
 */
function getSuggestions(context?: string): string[] {
  if (context?.includes('supplies')) {
    return [
      'Search for seeds for the current season',
      'Find organic fertilizers',
      'Compare pesticide prices',
      'View farming tools available'
    ];
  } else if (context?.includes('crops')) {
    return [
      'Add a new crop',
      'Check harvest predictions',
      'View crop health status',
      'Get planting recommendations'
    ];
  } else if (context?.includes('equipment')) {
    return [
      'Find available tractors',
      'Compare rental rates',
      'Book harvesting equipment',
      'View equipment specifications'
    ];
  } else if (context?.includes('market')) {
    return [
      'Check current market prices',
      'List crops for sale',
      'View price trends',
      'Connect with buyers'
    ];
  }

  return [
    'Explore agricultural supplies',
    'Manage your crops',
    'Rent farming equipment',
    'Check market prices'
  ];
}
