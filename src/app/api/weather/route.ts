import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/weather - Get weather data for a location
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const location = searchParams.get('location') || 'New Delhi, India'

    // First check if we have recent data in database (within 5 minutes)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: cachedWeather } = await supabase
      .from('weather_data')
      .select('*')
      .eq('location', location)
      .gte('created_at', fiveMinutesAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cachedWeather) {
      return NextResponse.json({ 
        weather: formatWeatherData(cachedWeather),
        source: 'cache'
      })
    }

    // Fetch fresh data from OpenWeatherMap API
    const apiKey = process.env.OPENWEATHER_API_KEY
    if (!apiKey) {
      console.warn('OpenWeatherMap API key not configured, returning mock data')
      return NextResponse.json({ 
        weather: getMockWeatherData(location),
        source: 'mock'
      })
    }

    // Get coordinates first
    const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${apiKey}`
    const geocodeResponse = await fetch(geocodeUrl)
    const geocodeData = await geocodeResponse.json()

    if (!geocodeData.length) {
      throw new Error('Location not found')
    }

    const { lat, lon } = geocodeData[0]

    // Get current weather and 5-day forecast
    const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    const weatherResponse = await fetch(weatherUrl)
    
    if (!weatherResponse.ok) {
      throw new Error('Weather API request failed')
    }

    const weatherData = await weatherResponse.json()

    // Process and store weather data
    const currentWeather = weatherData.list[0]
    const processedData = {
      location: `${weatherData.city.name}, ${weatherData.city.country}`,
      temperature: Math.round(currentWeather.main.temp),
      condition: currentWeather.weather[0].description,
      humidity: currentWeather.main.humidity,
      windSpeed: Math.round(currentWeather.wind.speed * 3.6), // Convert m/s to km/h
      rainfall: currentWeather.rain?.['3h'] || 0,
      forecast: weatherData.list.slice(0, 24).filter((_, index) => index % 8 === 0).map((item: any) => ({
        date: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
        high: Math.round(item.main.temp_max),
        low: Math.round(item.main.temp_min),
        condition: item.weather[0].description
      })).slice(0, 3)
    }

    // Store in database
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
    })

  } catch (error) {
    console.error('Weather API error:', error)
    
    // Fallback to mock data
    const location = new URL(request.url).searchParams.get('location') || 'New Delhi, India'
    return NextResponse.json({ 
      weather: getMockWeatherData(location),
      source: 'mock'
    })
  }
}

// POST /api/weather/update - Update weather data (for cron job)
export async function POST(request: NextRequest) {
  try {
    // This endpoint can be called by a cron job every 5 minutes
    const body = await request.json()
    const locations = body.locations || ['New Delhi, India', 'Mumbai, India', 'Bangalore, India']

    const results = []

    for (const location of locations) {
      try {
        // Make internal API call to get weather data
        const response = await fetch(`${request.nextUrl.origin}/api/weather?location=${encodeURIComponent(location)}`)
        const data = await response.json()
        results.push({ location, success: true, data: data.weather })
      } catch (error) {
        results.push({ location, success: false, error: error.message })
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
    temperature: 25 + Math.floor(Math.random() * 15), // 25-40°C
    condition: ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'][Math.floor(Math.random() * 4)],
    humidity: 40 + Math.floor(Math.random() * 40), // 40-80%
    windSpeed: 5 + Math.floor(Math.random() * 20), // 5-25 km/h
    rainfall: Math.random() * 2, // 0-2mm
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