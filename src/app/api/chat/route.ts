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

    // Build system message based on context
    const systemMessage = getSystemMessage(context)

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

function getSystemMessage(context?: string): string {
  const baseMessage = `You are FarmCon AI, a helpful farming assistant for Indian farmers. You help with:
- Crop recommendations and seasonal advice
- Agricultural supply information (seeds, fertilizers, pesticides, tools)
- Equipment rental guidance (tractors, harvesters, etc.)
- Market prices and selling strategies
- Order tracking and delivery information
- General farming best practices

Be concise, friendly, and use farming emojis when appropriate. Keep responses under 150 words unless asked for detailed information.`

  // Add context-specific information
  const contextMessages: Record<string, string> = {
    '/dashboard/supplies': '\n\nYou are currently on the Agricultural Supplies page. Help users find seeds, fertilizers, pesticides, and farming tools. Mention that they can browse categories or search for specific products.',
    '/dashboard/crops': '\n\nYou are on the Crop Management page. Help users with crop tracking, planting schedules, harvest predictions, and crop health monitoring.',
    '/dashboard/equipment': '\n\nYou are on the Equipment Rental page. Help users find tractors, harvesters, and other farming equipment available for rent. Discuss rental rates and availability.',
    '/dashboard/market': '\n\nYou are on the Market page. Help users understand current market prices, best selling times, and direct-to-consumer selling opportunities.',
    '/dashboard/orders': '\n\nYou are on the Orders page. Help users track their orders, understand delivery timelines, and resolve order-related issues.',
    '/dashboard/weather': '\n\nYou are on the Weather page. Provide weather-related farming advice, irrigation recommendations, and seasonal planning tips.',
    '/': '\n\nYou are on the FarmCon landing page. Introduce the platform features: crop management, market prices, agricultural supplies, equipment rental, and direct sales. Encourage users to sign up.',
  }

  return baseMessage + (context && contextMessages[context] ? contextMessages[context] : '')
}
