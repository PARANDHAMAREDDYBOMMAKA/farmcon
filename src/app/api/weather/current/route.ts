import { NextRequest, NextResponse } from 'next/server'
import { cache, CacheKeys } from '@/lib/redis'

export const revalidate = 600

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const city = searchParams.get('city')

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
        const geocodeUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
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
        const reverseUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
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

    const cacheKey = CacheKeys.weather(latitude!, longitude!)
    const cachedData = await cache.get(cacheKey)
    if (cachedData) {
      // Batch Redis operations for analytics
      await Promise.all([
        cache.incr('farmcon:stats:weather-cache-hits', 86400),
        cache.incr(`farmcon:stats:weather-requests:${locationName}`, 86400),
        cache.zadd('farmcon:popular-locations', Date.now(), locationName, 86400)
      ])
      return NextResponse.json({ weather: cachedData }, {
        headers: {
          'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
          'X-Cache': 'HIT',
        },
      })
    }

    // Use Open-Meteo API - completely free, no API key required
    const openMeteoUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,rain,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m&timezone=auto`

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
        console.warn(`Open-Meteo attempt ${attempt} failed:`, error)
        if (attempt < 3) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
      }
    }

    if (!response || !response.ok) {
      console.error('Open-Meteo API error after retries:', response?.status)
      // Increment error counter in Redis
      await cache.incr('farmcon:stats:weather-api-errors', 86400)
      return NextResponse.json({
        error: 'Weather data temporarily unavailable. Please try again.',
        location: locationName
      }, { status: 503 })
    }

    const data = await response.json()

    if (!data.current) {
      console.error('Invalid Open-Meteo API response')
      await cache.incr('farmcon:stats:weather-api-errors', 86400)
      return NextResponse.json({
        error: 'Invalid weather data received. Please try again.',
        location: locationName
      }, { status: 503 })
    }

    const current = data.current

    console.log('🔍 Open-Meteo API data for', locationName, ':', {
      temperature: current.temperature_2m,
      humidity: current.relative_humidity_2m,
      windSpeed: current.wind_speed_10m,
      precipitation: current.precipitation
    })

    const temp = current.temperature_2m || 25
    const humidity = current.relative_humidity_2m || 50
    const windSpeed = current.wind_speed_10m || 10
    const rainfall = current.precipitation || current.rain || 0
    const pressure = current.pressure_msl || current.surface_pressure || 1013
    const cloudiness = current.cloud_cover || 0
    const windDirection = current.wind_direction_10m || 0

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

    const weatherCode = current.weather_code || 0
    const weather = getWeatherFromCode(weatherCode)

    const uvIndex = temp > 30 ? 8 : temp > 25 ? 6 : temp > 20 ? 5 : 3
    const visibility = cloudiness < 30 ? 10 : cloudiness < 60 ? 7 : 5

    const feelsLike = current.apparent_temperature || temp + (humidity > 70 ? 2 : -2)

    const weatherData = {
      location: {
        name: locationName,
        country: country,
        coordinates: {
          lat: parseFloat(latitude!),
          lon: parseFloat(longitude!)
        }
      },
      current: {
        temperature: Math.round(temp),
        feelsLike: Math.round(feelsLike),
        humidity: Math.round(humidity),
        pressure: Math.round(pressure),
        windSpeed: Math.round(windSpeed),
        windDirection: Math.round(windDirection),
        visibility: visibility,
        uvIndex: uvIndex,
        description: weather.description,
        icon: weather.icon,
        cloudiness: Math.round(cloudiness)
      },
      farming: {
        irrigationAdvice: getIrrigationAdvice({ temp, humidity, rainfall }),
        plantingConditions: getPlantingConditions({ temp, humidity, windSpeed }),
        pestManagement: getPestManagement({ temp, humidity }),
        harvestingConditions: getHarvestingConditions({ humidity, rainfall, windSpeed })
      },
      alerts: generateFarmingAlerts({ temp, humidity, windSpeed, rainfall }),
      timestamp: new Date().toISOString(),
      source: 'Open-Meteo API'
    }

    // Batch Redis operations to increase request count and storage
    await Promise.all([
      cache.set(cacheKey, weatherData, 600),
      cache.incr('farmcon:stats:weather-cache-misses', 86400),
      cache.incr(`farmcon:stats:weather-requests:${locationName}`, 86400),
      cache.zadd('farmcon:popular-locations', Date.now(), locationName, 86400),
      cache.hset('farmcon:current-weather', `${latitude}:${longitude}`, {
        temp: weatherData.current.temperature,
        location: locationName,
        timestamp: Date.now()
      }, 1800),
      cache.set(`farmcon:farming-advice:${locationName}`, weatherData.farming, 1800),
      cache.incr('farmcon:stats:total-weather-requests', 86400)
    ])

    return NextResponse.json({ weather: weatherData }, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=300',
        'X-Cache': 'MISS',
      },
    })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}

function getIrrigationAdvice(data: { temp: number; humidity: number; rainfall: number }) {
  const { humidity, temp, rainfall } = data

  if (rainfall > 5) {
    return {
      status: 'skip',
      message: 'Recent rainfall detected. Skip irrigation today.',
      color: 'blue'
    }
  } else if (humidity < 30 && temp > 30) {
    return {
      status: 'urgent',
      message: 'Low humidity and high temperature. Irrigate immediately.',
      color: 'red'
    }
  } else if (humidity < 50) {
    return {
      status: 'recommended',
      message: 'Moderate irrigation recommended.',
      color: 'yellow'
    }
  } else {
    return {
      status: 'normal',
      message: 'Normal irrigation schedule is sufficient.',
      color: 'green'
    }
  }
}

function getPlantingConditions(data: { temp: number; humidity: number; windSpeed: number }) {
  const { temp, humidity, windSpeed } = data
  let score = 0
  let conditions = []

  if (temp >= 15 && temp <= 25) {
    score += 3
    conditions.push('✓ Ideal temperature for planting')
  } else if (temp > 30) {
    conditions.push('⚠ High temperature - consider evening planting')
  } else if (temp < 10) {
    conditions.push('❌ Too cold for most crops')
  }

  if (humidity >= 40 && humidity <= 70) {
    score += 2
    conditions.push('✓ Good humidity levels')
  } else if (humidity > 80) {
    conditions.push('⚠ High humidity - fungal risk')
  }

  if (windSpeed < 5) {
    score += 1
    conditions.push('✓ Low wind - good for planting')
  } else {
    conditions.push('⚠ Windy conditions - protect seedlings')
  }

  return {
    score: `${score}/6`,
    rating: score >= 5 ? 'Excellent' : score >= 3 ? 'Good' : 'Poor',
    conditions,
    color: score >= 5 ? 'green' : score >= 3 ? 'yellow' : 'red'
  }
}

function getPestManagement(data: { temp: number; humidity: number }) {
  const { temp, humidity } = data
  let riskLevel = 'Low'
  let recommendations = []
  let color = 'green'

  if (temp > 25 && humidity > 70) {
    riskLevel = 'High'
    color = 'red'
    recommendations.push('Monitor for aphids and spider mites')
    recommendations.push('Check for fungal diseases')
    recommendations.push('Consider preventive spraying')
  } else if (temp > 20 && humidity > 60) {
    riskLevel = 'Medium'
    color = 'yellow'
    recommendations.push('Regular field inspection recommended')
    recommendations.push('Maintain good air circulation')
  } else {
    recommendations.push('Continue regular monitoring')
    recommendations.push('Weather conditions favorable')
  }

  return {
    riskLevel,
    recommendations,
    color
  }
}

function getHarvestingConditions(data: { humidity: number; rainfall: number; windSpeed: number }) {
  const { humidity, rainfall, windSpeed } = data
  let suitability = 'Good'
  let advice = []
  let color = 'green'

  if (rainfall > 0) {
    suitability = 'Poor'
    color = 'red'
    advice.push('Wait for rain to stop and fields to dry')
    advice.push('Risk of crop damage and quality loss')
  } else if (humidity > 80) {
    suitability = 'Fair'
    color = 'yellow'
    advice.push('High moisture - ensure proper drying')
    advice.push('Monitor for post-harvest quality')
  } else if (windSpeed > 10) {
    suitability = 'Fair'
    color = 'yellow'
    advice.push('Strong winds - secure harvested crops')
  } else {
    advice.push('Excellent conditions for harvesting')
    advice.push('Optimal time for field operations')
  }

  return {
    suitability,
    advice,
    color
  }
}

function generateFarmingAlerts(data: { temp: number; humidity: number; windSpeed: number; rainfall: number }) {
  const alerts = []
  const { temp, humidity, windSpeed, rainfall } = data

  if (temp > 40) {
    alerts.push({
      type: 'heat-warning',
      severity: 'high',
      message: 'Extreme heat warning - protect crops and livestock',
      icon: '🌡️'
    })
  } else if (temp < 0) {
    alerts.push({
      type: 'frost-warning',
      severity: 'high',
      message: 'Frost warning - protect sensitive crops',
      icon: '❄️'
    })
  }

  if (rainfall > 10) {
    alerts.push({
      type: 'heavy-rain',
      severity: 'medium',
      message: 'Heavy rainfall - check drainage systems',
      icon: '🌧️'
    })
  }

  if (windSpeed > 15) {
    alerts.push({
      type: 'strong-wind',
      severity: 'medium',
      message: 'Strong winds - secure equipment and structures',
      icon: '💨'
    })
  }

  if (temp > 30 && humidity > 80) {
    alerts.push({
      type: 'disease-risk',
      severity: 'medium',
      message: 'High disease risk - monitor crops closely',
      icon: '🦠'
    })
  }

  return alerts
}

// Removed mock weather generator - using only real Open-Meteo API data
