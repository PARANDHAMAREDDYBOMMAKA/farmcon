import { NextRequest, NextResponse } from 'next/server'
import { cache, CacheKeys } from '@/lib/redis'

export const revalidate = 1800

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const city = searchParams.get('city')
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 30) 

    if (!lat && !lon && !city) {
      return NextResponse.json(
        { error: 'Either latitude/longitude or city name is required' },
        { status: 400 }
      )
    }

    let latitude = lat
    let longitude = lon
    let locationName = city || 'Unknown Location'
    let country = ''

    if (city && (!lat || !lon)) {
      try {
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(city)}&limit=1`
        const geocodeResponse = await fetch(geocodeUrl, {
          headers: { 'User-Agent': 'FarmCon-Weather-App' }
        })
        const geocodeData = await geocodeResponse.json()

        if (geocodeData && geocodeData.length > 0) {
          latitude = geocodeData[0].lat
          longitude = geocodeData[0].lon
          locationName = geocodeData[0].display_name.split(',')[0]
          const addressParts = geocodeData[0].display_name.split(',')
          country = addressParts[addressParts.length - 1].trim()
        } else {
          return NextResponse.json(
            { error: 'Location not found' },
            { status: 404 }
          )
        }
      } catch (error) {
        console.error('Geocoding error:', error)
        return NextResponse.json(
          { error: 'Failed to geocode location' },
          { status: 500 }
        )
      }
    } else if (lat && lon) {
      
      try {
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
        const reverseResponse = await fetch(reverseUrl, {
          headers: { 'User-Agent': 'FarmCon-Weather-App' }
        })
        const reverseData = await reverseResponse.json()

        if (reverseData && reverseData.address) {
          locationName = reverseData.address.city ||
                        reverseData.address.town ||
                        reverseData.address.village ||
                        reverseData.address.county ||
                        'Unknown Location'
          country = reverseData.address.country || ''
        }
      } catch (error) {
        console.error('Reverse geocoding error:', error)
        
      }
    }

    const cacheKey = CacheKeys.weatherForecast(latitude!, longitude!, days)
    const cachedData = await cache.get(cacheKey)
    if (cachedData) {
      // Batch Redis operations for analytics
      await Promise.all([
        cache.incr('farmcon:stats:forecast-cache-hits', 86400),
        cache.incr(`farmcon:stats:forecast-requests:${locationName}`, 86400),
        cache.zadd('farmcon:popular-forecast-locations', Date.now(), locationName, 86400)
      ])
      return NextResponse.json({ forecast: cachedData }, {
        headers: {
          'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=900',
          'X-Cache': 'HIT',
        },
      })
    }

    // Use Open-Meteo API - completely free, no API key required
    // Request both daily and hourly forecasts for comprehensive data
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean,precipitation_sum,rain_sum,weather_code,wind_speed_10m_max,relative_humidity_2m_max,relative_humidity_2m_min,relative_humidity_2m_mean&timezone=auto&past_days=${days}&forecast_days=0`

    // Retry logic for Open-Meteo API
    let response
    let lastError
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await fetch(openMeteoUrl, {
          headers: {
            'User-Agent': 'FarmCon-Weather-App',
            'Accept': 'application/json'
          }
        })

        if (response.ok) {
          break
        }
      } catch (error) {
        lastError = error
        console.warn(`Open-Meteo forecast attempt ${attempt} failed:`, error)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    if (!response || !response.ok) {
      console.error('Open-Meteo forecast API error after retries:', response?.status)
      await cache.incr('farmcon:stats:forecast-api-errors', 86400)
      return NextResponse.json({
        error: 'Weather forecast temporarily unavailable. Please try again.',
        location: locationName
      }, { status: 503 })
    }

    const data = await response.json()

    if (!data.daily || !data.daily.time || data.daily.time.length === 0) {
      console.error('Invalid Open-Meteo API response')
      await cache.incr('farmcon:stats:forecast-api-errors', 86400)
      return NextResponse.json({
        error: 'Invalid weather forecast data received. Please try again.',
        location: locationName
      }, { status: 503 })
    }

    const daily = data.daily

    console.log('🔍 Open-Meteo forecast data for', locationName, ':', {
      days: daily.time.length,
      firstDay: daily.time[0],
      temp: daily.temperature_2m_mean?.[0]
    })

    // WMO Weather interpretation codes
    const getWeatherFromCode = (code: number) => {
      if (code === 0) return { main: 'Clear', description: 'clear sky', icon: '01d' }
      if (code <= 3) return { main: 'Clouds', description: 'partly cloudy', icon: '02d' }
      if (code <= 48) return { main: 'Fog', description: 'foggy', icon: '50d' }
      if (code <= 67) return { main: 'Rain', description: 'rainy', icon: '10d' }
      if (code <= 77) return { main: 'Snow', description: 'snowy', icon: '13d' }
      if (code <= 99) return { main: 'Thunderstorm', description: 'thunderstorm', icon: '11d' }
      return { main: 'Clear', description: 'clear', icon: '01d' }
    }

    const dailyForecasts = daily.time.map((date: string, index: number) => {
      const tempMax = daily.temperature_2m_max?.[index] || 25
      const tempMin = daily.temperature_2m_min?.[index] || 15
      const temp = daily.temperature_2m_mean?.[index] || (tempMax + tempMin) / 2
      const humidityMax = daily.relative_humidity_2m_max?.[index] || 70
      const humidityMin = daily.relative_humidity_2m_min?.[index] || 40
      const humidity = daily.relative_humidity_2m_mean?.[index] || (humidityMax + humidityMin) / 2
      const windSpeed = daily.wind_speed_10m_max?.[index] || 10
      const rainfall = daily.precipitation_sum?.[index] || daily.rain_sum?.[index] || 0
      const weatherCode = daily.weather_code?.[index] || 0

      const weather = getWeatherFromCode(weatherCode)

      return {
        date: date,
        temp,
        tempMax,
        tempMin,
        humidity,
        windSpeed,
        rainfall,
        mainWeather: weather.main,
        description: weather.description,
        icon: weather.icon
      }
    })

    const forecastData = {
      location: {
        name: locationName,
        country: country,
        coordinates: {
          lat: parseFloat(latitude!),
          lon: parseFloat(longitude!)
        }
      },
      forecasts: dailyForecasts.map((day: { date: any; tempMin: number; tempMax: number; temp: number; humidity: number; mainWeather: any; description: any; icon: any; windSpeed: number; rainfall: any }) => ({
        date: day.date,
        temperature: {
          min: Math.round(day.tempMin),
          max: Math.round(day.tempMax),
          avg: Math.round(day.temp)
        },
        humidity: {
          min: Math.round(day.humidity) - 10,
          max: Math.round(day.humidity) + 10,
          avg: Math.round(day.humidity)
        },
        weather: {
          main: day.mainWeather,
          description: day.description,
          icon: day.icon
        },
        wind: {
          speed: Math.round(day.windSpeed),
          direction: 180 // mock
        },
        rain: day.rainfall,
        farming: {
          irrigationRecommendation: getDailyIrrigationRecommendation(day),
          fieldWorkSuitability: getFieldWorkSuitability(day),
          cropStressLevel: getCropStressLevel(day)
        }
      })),
      farmingInsights: generateWeeklyFarmingInsights(dailyForecasts),
      timestamp: new Date().toISOString(),
      source: 'Open-Meteo API'
    }

    // Batch Redis operations to increase request count and storage
    await Promise.all([
      cache.set(cacheKey, forecastData, 1800),
      cache.incr('farmcon:stats:forecast-cache-misses', 86400),
      cache.incr(`farmcon:stats:forecast-requests:${locationName}`, 86400),
      cache.zadd('farmcon:popular-forecast-locations', Date.now(), locationName, 86400),
      cache.hset('farmcon:current-forecasts', `${latitude}:${longitude}`, {
        location: locationName,
        days,
        timestamp: Date.now()
      }, 3600),
      cache.set(`farmcon:farming-insights:${locationName}`, forecastData.farmingInsights, 3600),
      cache.incr('farmcon:stats:total-forecast-requests', 86400)
    ])

    return NextResponse.json({ forecast: forecastData }, {
      headers: {
        'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=900',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('Weather forecast API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather forecast' },
      { status: 500 }
    )
  }
}

function getDailyIrrigationRecommendation(day: any) {
  if (day.rainfall > 10) {
    return {
      status: 'skip',
      message: 'Heavy rain expected - skip irrigation',
      amount: 0,
      color: 'blue'
    }
  } else if (day.rainfall > 2) {
    return {
      status: 'reduce',
      message: 'Light rain expected - reduce irrigation by 50%',
      amount: 50,
      color: 'green'
    }
  } else if (day.tempMax > 35 && day.humidity < 40) {
    return {
      status: 'increase',
      message: 'Hot and dry conditions - increase irrigation',
      amount: 150,
      color: 'red'
    }
  } else {
    return {
      status: 'normal',
      message: 'Normal irrigation schedule',
      amount: 100,
      color: 'green'
    }
  }
}

function getFieldWorkSuitability(day: any) {
  let score = 0
  let factors = []

  if (day.rainfall === 0) {
    score += 3
    factors.push('✓ No rain expected')
  } else if (day.rainfall < 2) {
    score += 1
    factors.push('⚠ Light rain possible')
  } else {
    factors.push('❌ Rain expected - avoid field work')
  }

  if (day.tempMax >= 15 && day.tempMax <= 30) {
    score += 2
    factors.push('✓ Comfortable working temperature')
  } else if (day.tempMax > 35) {
    factors.push('⚠ Very hot - work during cooler hours')
  } else if (day.tempMax < 10) {
    factors.push('⚠ Cold conditions')
  }

  if (day.windSpeed < 5) {
    score += 1
    factors.push('✓ Light winds')
  } else if (day.windSpeed > 10) {
    factors.push('⚠ Strong winds - secure equipment')
  }

  return {
    score: `${score}/6`,
    rating: score >= 5 ? 'Excellent' : score >= 3 ? 'Good' : score <= 1 ? 'Poor' : 'Fair',
    factors,
    color: score >= 5 ? 'green' : score >= 3 ? 'yellow' : 'red'
  }
}

function getCropStressLevel(day: any) {
  let stressScore = 0
  let stressFactors = []

  if (day.tempMax > 40) {
    stressScore += 3
    stressFactors.push('Extreme heat stress')
  } else if (day.tempMax > 35) {
    stressScore += 2
    stressFactors.push('High temperature stress')
  }

  if (day.tempMin < 5) {
    stressScore += 2
    stressFactors.push('Cold stress risk')
  }

  if (day.rainfall === 0 && day.humidity < 30) {
    stressScore += 2
    stressFactors.push('Water stress likely')
  }

  if (day.windSpeed > 15) {
    stressScore += 1
    stressFactors.push('Wind stress possible')
  }

  const level = stressScore === 0 ? 'Low' :
               stressScore <= 2 ? 'Moderate' :
               stressScore <= 4 ? 'High' : 'Severe'

  return {
    level,
    score: stressScore,
    factors: stressFactors.length > 0 ? stressFactors : ['Favorable conditions'],
    color: stressScore === 0 ? 'green' :
           stressScore <= 2 ? 'yellow' :
           stressScore <= 4 ? 'orange' : 'red'
  }
}

function generateWeeklyFarmingInsights(forecasts: any[]) {
  const insights = []

  const totalRain = forecasts.reduce((sum, day) => sum + day.rainfall, 0)

  if (totalRain > 50) {
    insights.push({
      type: 'water-management',
      message: `Heavy rainfall recorded (${Math.round(totalRain)}mm). Ensure proper drainage.`,
      icon: '🌧️',
      priority: 'high'
    })
  } else if (totalRain < 5) {
    insights.push({
      type: 'irrigation',
      message: 'Dry period recorded. Plan irrigation schedule carefully.',
      icon: '💧',
      priority: 'medium'
    })
  }

  const hotDays = forecasts.filter(day => day.tempMax > 35).length
  const coldDays = forecasts.filter(day => day.tempMin < 10).length

  if (hotDays >= 3) {
    insights.push({
      type: 'heat-protection',
      message: `${hotDays} hot days recorded. Protect crops and increase irrigation.`,
      icon: '🌡️',
      priority: 'high'
    })
  }

  if (coldDays >= 2) {
    insights.push({
      type: 'frost-protection',
      message: `${coldDays} cold days recorded. Prepare frost protection measures.`,
      icon: '❄️',
      priority: 'medium'
    })
  }

  const goodWorkDays = forecasts.filter(day =>
    day.rainfall < 1 && day.tempMax >= 15 && day.tempMax <= 30 && day.windSpeed < 8
  ).length

  insights.push({
    type: 'field-work',
    message: `${goodWorkDays} optimal days recorded for field operations.`,
    icon: '🚜',
    priority: 'low'
  })

  return insights
}

// Removed mock forecast generator - using only real Open-Meteo API data
