import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cache } from '@/lib/redis'
import { getWeather } from '@/lib/weather-providers'

export const revalidate = 300

export async function GET(request: NextRequest) {
  const location = new URL(request.url).searchParams.get('location') || 'New Delhi, India'
  const nocache = new URL(request.url).searchParams.get('nocache') === '1'

  try {
    const cacheKey = `farmcon:weather:${location}`
    if (!nocache) {
      const cached = await cache.get<any>(cacheKey)
      if (cached) {
        return NextResponse.json({ weather: cached, source: 'redis-cache' })
      }
    }

    const snapshot = await getWeather(location)
    if (!snapshot) {
      return NextResponse.json(
        { error: 'Weather service unavailable. Please try again shortly.', location },
        { status: 503 },
      )
    }

    await cache.set(cacheKey, snapshot, 300)

    try {
      await supabase.from('weather_data').insert({
        location: snapshot.location,
        temperature_min: snapshot.forecast[0]?.low ?? snapshot.temperature,
        temperature_max: snapshot.forecast[0]?.high ?? snapshot.temperature,
        humidity: snapshot.humidity,
        rainfall: snapshot.rainfall,
        wind_speed: snapshot.windSpeed,
        weather_condition: snapshot.condition,
        date: new Date().toISOString().split('T')[0],
      })
    } catch (dbErr) {
      console.error('Weather DB insert failed (non-fatal):', dbErr)
    }

    return NextResponse.json(
      { weather: snapshot, source: snapshot.source },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=150',
        },
      },
    )
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch weather data',
        location,
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const locations: string[] = body.locations || [
      'New Delhi, India',
      'Mumbai, India',
      'Bangalore, India',
    ]

    const results = await Promise.all(
      locations.map(async (location) => {
        try {
          const res = await fetch(
            `${request.nextUrl.origin}/api/weather?location=${encodeURIComponent(location)}`,
          )
          const data = await res.json()
          return { location, success: res.ok, data: data.weather, error: data.error }
        } catch (err) {
          return {
            location,
            success: false,
            error: err instanceof Error ? err.message : 'Unknown error',
          }
        }
      }),
    )

    return NextResponse.json({ message: 'Weather data refreshed', results })
  } catch (error) {
    console.error('Weather bulk update error:', error)
    return NextResponse.json({ error: 'Failed to refresh weather data' }, { status: 500 })
  }
}
