import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

export async function POST(request: NextRequest) {
  try {
    const { messages, context } = await request.json() as { messages: Message[], context?: string }

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      )
    }

    // Get the latest user message to use for context retrieval
    const latestUserMessage = messages.filter(m => m.role === 'user').pop()?.content || ''

    // Retrieve relevant context from Meilisearch if available
    let retrievedContext = ''
    if (latestUserMessage && process.env.MEILISEARCH_HOST && process.env.MEILISEARCH_API_KEY) {
      try {
        console.log('🔍 Retrieving context for query:', latestUserMessage)
        console.log('📍 Page context:', context)
        retrievedContext = await getRelevantContext(latestUserMessage, context)
        if (retrievedContext) {
          console.log('✅ Context retrieved successfully')
        } else {
          console.log('⚠️ No relevant context found in Meilisearch')
        }
      } catch (error) {
        console.error('❌ Context retrieval error:', error)
        // Continue without Meilisearch context if it fails
      }
    } else {
      console.log('⚠️ Meilisearch not configured or no user message')
    }

    // Build system message based on context
    const systemMessage = getSystemMessage(context, retrievedContext)

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemMessage },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Groq API error:', error)
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: response.status }
      )
    }

    const data = await response.json()
    const aiMessage = data.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({ message: aiMessage })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'An error occurred while processing your request' },
      { status: 500 }
    )
  }
}

// Retrieve relevant context from Meilisearch based on user query and current page
async function getRelevantContext(userQuery: string, context?: string): Promise<string> {
  try {
    // Lazy load MeiliSearch
    const { search, INDEXES } = await import('@/lib/meilisearch')

    // Determine which index to search based on context
    let indexName = 'products' // default

    if (context?.includes('/dashboard/supplies') || context?.includes('supplies') || context?.includes('product')) {
      indexName = 'products'
      console.log('🔍 Searching in products index')
    } else if (context?.includes('/dashboard/crops') || context?.includes('crops') || context?.includes('crop')) {
      indexName = 'crops'
      console.log('🔍 Searching in crops index')
    } else if (context?.includes('/dashboard/equipment') || context?.includes('equipment') || context?.includes('rental')) {
      indexName = 'equipment'
      console.log('🔍 Searching in equipment index')
    } else {
      // For general dashboard or other pages, search across all indexes
      console.log('🔍 Searching in default products index')
    }

    // Search for relevant documents
    console.log(`🔎 Executing search: "${userQuery}" in ${indexName} index`)
    let searchResults = await search(indexName, userQuery, { limit: 10 })
    console.log(`📊 Search results: ${searchResults.hits?.length || 0} hits found`)

    // If no results with full query, try with empty query to get all documents
    if (!searchResults.hits || searchResults.hits.length === 0) {
      console.log('⚠️ No results with full query, trying to fetch all documents...')
      searchResults = await search(indexName, '', { limit: 10 })
      console.log(`📊 All documents fetch: ${searchResults.hits?.length || 0} hits found`)
    }

    if (!searchResults.hits || searchResults.hits.length === 0) {
      console.log('⚠️ No documents found in index at all')
      return ''
    }

    // Format the retrieved context
    let contextText = '\n\nRELEVANT DATA FROM DATABASE:\n'

    searchResults.hits.forEach((hit: any, index: number) => {
      contextText += `\n${index + 1}. ${hit.name}`
      if (hit.description) {
        contextText += ` - ${hit.description.substring(0, 100)}${hit.description.length > 100 ? '...' : ''}`
      }
      if (hit.price) {
        contextText += ` | Price: ₹${hit.price}`
      }
      if (hit.category) {
        contextText += ` | Category: ${hit.category}`
      }
      if (hit.status) {
        contextText += ` | Status: ${hit.status}`
      }
      if (hit.hourlyRate || hit.dailyRate) {
        contextText += ` | Rates: ${hit.hourlyRate ? `₹${hit.hourlyRate}/hr` : ''} ${hit.dailyRate ? `₹${hit.dailyRate}/day` : ''}`
      }
    })

    contextText += '\n\nUse the above data to provide accurate and specific answers to the user\'s question. Reference specific items, prices, and details from the data when answering.'

    console.log('✅ Context formatted successfully')
    return contextText
  } catch (error) {
    console.error('❌ Error retrieving context from Meilisearch:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
      console.error('Error stack:', error.stack)
    }
    return ''
  }
}

function getSystemMessage(context?: string, retrievedContext?: string): string {
  const baseMessage = `You are FarmCon AI, a helpful farming assistant for Indian farmers. You help with:
- Crop recommendations and seasonal advice
- Agricultural supply information (seeds, fertilizers, pesticides, tools)
- Equipment rental guidance (tractors, harvesters, etc.)
- Market prices and selling strategies
- Order tracking and delivery information
- General farming best practices

Be concise, friendly, and use farming emojis when appropriate. Keep responses under 150 words unless asked for detailed information.`

  // Add context-specific information
  let contextMessage = ''

  if (context) {
    console.log('🎯 Processing context:', context)

    if (context.includes('/dashboard/supplies') || context.includes('supplies')) {
      contextMessage = '\n\nYou are currently on the Agricultural Supplies page. Help users find seeds, fertilizers, pesticides, and farming tools. When answering questions about products, refer to the specific items available in the database.'
    } else if (context.includes('/dashboard/crops') || context.includes('crops')) {
      contextMessage = '\n\nYou are on the Crop Management page. Help users with crop tracking, planting schedules, harvest predictions, and crop health monitoring. Reference specific crop data when available.'
    } else if (context.includes('/dashboard/equipment') || context.includes('equipment')) {
      contextMessage = '\n\nYou are on the Equipment Rental page. Help users find tractors, harvesters, and other farming equipment available for rent. Discuss specific rental rates and availability from the database.'
    } else if (context.includes('/dashboard/market') || context.includes('market')) {
      contextMessage = '\n\nYou are on the Market page. Help users understand current market prices, best selling times, and direct-to-consumer selling opportunities.'
    } else if (context.includes('/dashboard/orders') || context.includes('orders')) {
      contextMessage = '\n\nYou are on the Orders page. Help users track their orders, understand delivery timelines, and resolve order-related issues.'
    } else if (context.includes('/dashboard/weather') || context.includes('weather')) {
      contextMessage = '\n\nYou are on the Weather page. Provide weather-related farming advice, irrigation recommendations, and seasonal planning tips.'
    } else if (context.includes('/dashboard')) {
      contextMessage = '\n\nYou are on the FarmCon Dashboard. This is the main control center where farmers can access all features including crop management, agricultural supplies, equipment rental, market prices, orders, and weather information. Help users navigate and understand the dashboard features.'
    } else if (context === '/' || context.includes('home')) {
      contextMessage = '\n\nYou are on the FarmCon landing page. Introduce the platform features: crop management, market prices, agricultural supplies, equipment rental, and direct sales. Encourage users to sign up.'
    }

    console.log('✅ Context message set:', contextMessage ? 'Yes' : 'No')
  }

  let systemMessage = baseMessage + contextMessage

  // Append retrieved context if available
  if (retrievedContext) {
    systemMessage += retrievedContext
    console.log('✅ Added database context to system message')
  }

  return systemMessage
}
