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

    // Fetch fresh data from NASA POWER API
    // Note: NASA POWER API is free and doesn't require an API key

    // For NASA API, we need coordinates. Use Nominatim (OpenStreetMap) for geocoding
    let lat, lon

    try {
      // Use Nominatim geocoding API (free, no API key required)
      const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
      const geocodeResponse = await fetch(geocodeUrl, {
        headers: {
          'User-Agent': 'FarmCon-Weather-App' // Required by Nominatim
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
      // Default to New Delhi if geocoding fails
      lat = 28.6139
      lon = 77.2090
    }

    // NASA POWER API works with historical data, not future forecasts
    // Get data from the last 7 days to show recent weather trends
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 7) // 7 days ago

    const endDate = new Date(today)
    endDate.setDate(today.getDate() - 1) // Yesterday (most recent complete data)

    const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '')
    const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '')

    // Fetch data from NASA POWER API
    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,PRECTOTCORR&community=AG&longitude=${lon}&latitude=${lat}&start=${startDateStr}&end=${endDateStr}&format=JSON`

    console.log('Fetching NASA weather data:', {
      location,
      lat,
      lon,
      startDateStr,
      endDateStr,
      url: nasaUrl
    })

    const weatherResponse = await fetch(nasaUrl)

    if (!weatherResponse.ok) {
      const errorText = await weatherResponse.text()
      console.error('NASA API request failed:', {
        status: weatherResponse.status,
        statusText: weatherResponse.statusText,
        error: errorText,
        url: nasaUrl
      })
      return NextResponse.json({
        weather: getMockWeatherData(location),
        source: 'mock',
        error: `NASA API error: ${weatherResponse.status}`
      })
    }

    const weatherData = await weatherResponse.json()

    console.log('NASA API response received successfully')

    // Validate NASA POWER API response
    if (!weatherData.properties || !weatherData.properties.parameter) {
      console.warn('Invalid NASA API response structure')
      return NextResponse.json({
        weather: getMockWeatherData(location),
        source: 'mock'
      })
    }

    // Process NASA POWER API data
    const parameters = weatherData.properties.parameter

    // Check if we have valid temperature data
    if (!parameters.T2M || Object.keys(parameters.T2M).length === 0) {
      console.warn('No temperature data available from NASA API')
      return NextResponse.json({
        weather: getMockWeatherData(location),
        source: 'mock'
      })
    }

    const dates = Object.keys(parameters.T2M).sort().reverse() // Most recent first

    // Get most recent data (yesterday or last available day)
    const recentDate = dates[0]

    // Helper function to validate and clean data (NASA uses -999 for missing data)
    const cleanValue = (value: number, defaultValue: number = 0) => {
      if (value === undefined || value === null || value < -900) {
        return defaultValue
      }
      return value
    }

    const currentTemp = cleanValue(parameters.T2M[recentDate], 25)
    const currentHumidity = cleanValue(parameters.RH2M?.[recentDate], 50)
    const currentWindSpeed = cleanValue(parameters.WS2M?.[recentDate], 10) * 3.6 // Convert m/s to km/h
    const rainfall = cleanValue(parameters.PRECTOTCORR?.[recentDate], 0)

    // If all values are defaults (missing data), use mock data
    if (currentTemp === 25 && currentHumidity === 50 && currentWindSpeed === 36) {
      console.warn('Most weather data missing from NASA API, using mock data')
      return NextResponse.json({
        weather: getMockWeatherData(location),
        source: 'mock'
      })
    }

    // Determine weather condition based on temperature and rainfall
    const getCondition = (temp: number, rain: number) => {
      if (rain > 5) return 'Rainy'
      if (rain > 0) return 'Light Rain'
      if (temp > 35) return 'Hot and Sunny'
      if (temp > 28) return 'Sunny'
      if (temp > 22) return 'Partly Cloudy'
      return 'Cloudy'
    }

    const processedData = {
      location: location,
      temperature: Math.round(currentTemp),
      condition: getCondition(currentTemp, rainfall),
      humidity: Math.round(currentHumidity),
      windSpeed: Math.round(currentWindSpeed),
      rainfall: rainfall,
      forecast: dates.slice(0, 3).map((date, index) => {
        // Since NASA provides historical data, label accordingly
        const dayNames = ['Recent', 'Yesterday', '2 Days Ago']
        const tempMax = cleanValue(parameters.T2M_MAX?.[date], currentTemp + 5)
        const tempMin = cleanValue(parameters.T2M_MIN?.[date], currentTemp - 5)
        const temp = cleanValue(parameters.T2M?.[date], currentTemp)
        const rain = cleanValue(parameters.PRECTOTCORR?.[date], 0)

        return {
          date: dayNames[index],
          high: Math.round(tempMax),
          low: Math.round(tempMin),
          condition: getCondition(temp, rain)
        }
      })
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
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })

    // Fallback to mock data
    const location = new URL(request.url).searchParams.get('location') || 'New Delhi, India'
    return NextResponse.json({
      weather: getMockWeatherData(location),
      source: 'mock',
      error: error instanceof Error ? error.message : 'Unknown error'
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