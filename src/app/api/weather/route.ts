import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { cache, CacheKeys } from '@/lib/redis'

export const revalidate = 300

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') || 'New Delhi, India'

    const cacheKey = `farmcon:weather:${location}`
    const cachedWeather = await cache.get(cacheKey)

    if (cachedWeather) {
      return NextResponse.json({
        weather: cachedWeather,
        source: 'redis-cache'
      })
    }

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()

    const { data: dbCachedWeather } = await supabase
      .from('weather_data')
      .select('*')
      .eq('location', location)
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (dbCachedWeather) {
      const weatherData = formatWeatherData(dbCachedWeather)
      
      await cache.set(cacheKey, weatherData, 300)
      return NextResponse.json({
        weather: weatherData,
        source: 'db-cache'
      })
    }

    let lat, lon

    try {
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      const geocodeResponse = await fetch(geocodeUrl, {
        headers: {
          'User-Agent': 'FarmCon-Weather-App' 
        }
      })

      if (!geocodeResponse.ok) {
        throw new Error('Geocoding failed')
      }

      const geocodeData = await geocodeResponse.json()

      if (!geocodeData || geocodeData.length === 0) {
        throw new Error('Location not found')
      }

      lat = parseFloat(geocodeData[0].lat)
      lon = parseFloat(geocodeData[0].lon)
    } catch (geocodeError) {
      console.warn('Geocoding error, using default location (New Delhi):', geocodeError)
      
      lat = 28.6139
      lon = 77.2090
    }

    // Use Open-Meteo API - completely free, no API key required
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum&timezone=auto&past_days=2&forecast_days=1`

    console.log('🌤️  Fetching Open-Meteo weather data:', {
      location,
      lat,
      lon,
      url: openMeteoUrl
    })

    const weatherResponse = await fetch(openMeteoUrl)

    if (!weatherResponse.ok) {
      console.error('❌ Open-Meteo API request failed:', {
        status: weatherResponse.status,
        statusText: weatherResponse.statusText
      })

      return NextResponse.json({
        weather: getMockWeatherData(location),
        source: 'mock',
        error: `Weather API error: ${weatherResponse.status}`
      }, { status: 200 })
    }

    const weatherData = await weatherResponse.json()

    console.log('✅ Open-Meteo API response received successfully', {
      hasCurrent: !!weatherData.current,
      hasDaily: !!weatherData.daily,
      temperature: weatherData.current?.temperature_2m
    })

    if (!weatherData.current || !weatherData.daily) {
      console.warn('Invalid Open-Meteo API response structure')
      return NextResponse.json({
        weather: getMockWeatherData(location),
        source: 'mock'
      })
    }

    const current = weatherData.current
    const daily = weatherData.daily

    const currentTemp = current.temperature_2m || 25
    const currentHumidity = current.relative_humidity_2m || 50
    const currentWindSpeed = current.wind_speed_10m || 10
    const rainfall = current.precipitation || current.rain || 0
    const weatherCode = current.weather_code || 0

    // WMO Weather interpretation codes
    const getWeatherFromCode = (code: number) => {
      if (code === 0) return 'Clear Sky'
      if (code <= 3) return 'Partly Cloudy'
      if (code <= 48) return 'Foggy'
      if (code <= 67) return 'Rainy'
      if (code <= 77) return 'Snowy'
      if (code <= 99) return 'Thunderstorm'
      return 'Clear'
    }

    const getCondition = (code: number, rain: number) => {
      if (rain > 5) return 'Rainy'
      if (rain > 0) return 'Light Rain'
      return getWeatherFromCode(code)
    }

    const processedData = {
      location: location,
      temperature: Math.round(currentTemp),
      condition: getCondition(weatherCode, rainfall),
      humidity: Math.round(currentHumidity),
      windSpeed: Math.round(currentWindSpeed),
      rainfall: Math.round(rainfall * 10) / 10,
      forecast: daily.time.slice(0, 3).map((date: string, index: number) => {
        const dayNames = ['Recent', 'Yesterday', 'Tomorrow']
        const tempMax = daily.temperature_2m_max?.[index] || currentTemp + 5
        const tempMin = daily.temperature_2m_min?.[index] || currentTemp - 5
        const dayWeatherCode = daily.weather_code?.[index] || 0
        const dayRain = daily.precipitation_sum?.[index] || 0

        return {
          date: dayNames[index],
          high: Math.round(tempMax),
          low: Math.round(tempMin),
          condition: getCondition(dayWeatherCode, dayRain)
        }
      })
    }

    await cache.set(cacheKey, processedData, 300)

    await supabase
      .from('weather_data')
      .insert({
        location: processedData.location,
        temperature_min: processedData.forecast[0]?.low || processedData.temperature,
        temperature_max: processedData.forecast[0]?.high || processedData.temperature,
        humidity: processedData.humidity,
        rainfall: processedData.rainfall,
        wind_speed: processedData.windSpeed,
        weather_condition: processedData.condition,
        date: new Date().toISOString().split('T')[0]
      })

    return NextResponse.json({
      weather: processedData,
      source: 'api'
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=150',
      },
    })

  } catch (error) {
    console.error('Weather API error:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    const location = new URL(request.url).searchParams.get('location') || 'New Delhi, India'
    return NextResponse.json({
      weather: getMockWeatherData(location),
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json()
    const locations = body.locations || ['New Delhi, India', 'Mumbai, India', 'Bangalore, India']

    const results = []

    for (const location of locations) {
      try {
        
        const response = await fetch(`${request.nextUrl.origin}/api/weather?location=${encodeURIComponent(location)}`)
        const data = await response.json()
        results.push({ location, success: true, data: data.weather })
      } catch (error) {
        results.push({ location, success: false, error: error instanceof Error ? error.message : 'Unknown error' })
      }
    }

    return NextResponse.json({ 
      message: 'Weather data updated',
      results
    })

  } catch (error) {
    console.error('Weather update error:', error)
    return NextResponse.json(
      { error: 'Failed to update weather data' },
      { status: 500 }
    )
  }
}

function formatWeatherData(dbWeather: any) {
  return {
    location: dbWeather.location,
    temperature: Math.round((dbWeather.temperature_min + dbWeather.temperature_max) / 2),
    condition: dbWeather.weather_condition,
    humidity: dbWeather.humidity,
    windSpeed: dbWeather.wind_speed,
    rainfall: dbWeather.rainfall,
    forecast: [
      {
        date: 'Today',
        high: dbWeather.temperature_max,
        low: dbWeather.temperature_min,
        condition: dbWeather.weather_condition
      },
      {
        date: 'Tomorrow',
        high: dbWeather.temperature_max + Math.floor(Math.random() * 6) - 3,
        low: dbWeather.temperature_min + Math.floor(Math.random() * 4) - 2,
        condition: dbWeather.weather_condition
      },
      {
        date: 'Day 3',
        high: dbWeather.temperature_max + Math.floor(Math.random() * 8) - 4,
        low: dbWeather.temperature_min + Math.floor(Math.random() * 6) - 3,
        condition: 'Partly Cloudy'
      }
    ]
  }
}

function getMockWeatherData(location: string) {
  return {
    location,
    temperature: 25 + Math.floor(Math.random() * 15), 
    condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
    humidity: 40 + Math.floor(Math.random() * 40), 
    windSpeed: 5 + Math.floor(Math.random() * 20), 
    rainfall: Math.random() * 2, 
    forecast: [
      {
        date: 'Today',
        high: 32 + Math.floor(Math.random() * 8),
        low: 20 + Math.floor(Math.random() * 8),
        condition: 'Sunny'
      },
      {
        date: 'Tomorrow',
        high: 30 + Math.floor(Math.random() * 8),
        low: 18 + Math.floor(Math.random() * 8),
        condition: 'Partly Cloudy'
      },
      {
        date: 'Day 3',
        high: 28 + Math.floor(Math.random() * 8),
        low: 16 + Math.floor(Math.random() * 8),
        condition: 'Light Rain'
      }
    ]
  }
}