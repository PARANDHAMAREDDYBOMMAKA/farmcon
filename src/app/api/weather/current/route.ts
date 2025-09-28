import { NextRequest, NextResponse } from 'next/server'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'demo-key'
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

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

    let url = `${OPENWEATHER_BASE_URL}/weather?appid=${OPENWEATHER_API_KEY}&units=metric`

    if (lat && lon) {
      url += `&lat=${lat}&lon=${lon}`
    } else if (city) {
      url += `&q=${encodeURIComponent(city)}`
    }

    const response = await fetch(url)

    if (!response.ok) {
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Weather API key not configured or invalid' },
          { status: 401 }
        )
      }
      throw new Error(`Weather API error: ${response.status}`)
    }

    const data = await response.json()

    // Transform data for farming context
    const weatherData = {
      location: {
        name: data.name,
        country: data.sys.country,
        coordinates: {
          lat: data.coord.lat,
          lon: data.coord.lon
        }
      },
      current: {
        temperature: Math.round(data.main.temp),
        feelsLike: Math.round(data.main.feels_like),
        humidity: data.main.humidity,
        pressure: data.main.pressure,
        windSpeed: data.wind.speed,
        windDirection: data.wind.deg,
        visibility: data.visibility / 1000, // Convert to km
        uvIndex: data.uvi || 'N/A',
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        cloudiness: data.clouds.all
      },
      farming: {
        irrigationAdvice: getIrrigationAdvice(data),
        plantingConditions: getPlantingConditions(data),
        pestManagement: getPestManagement(data),
        harvestingConditions: getHarvestingConditions(data)
      },
      alerts: generateFarmingAlerts(data),
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap'
    }

    return NextResponse.json({ weather: weatherData })
  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    )
  }
}

function getIrrigationAdvice(data: any) {
  const humidity = data.main.humidity
  const temp = data.main.temp
  const rain = data.rain?.['1h'] || 0

  if (rain > 5) {
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

function getPlantingConditions(data: any) {
  const temp = data.main.temp
  const humidity = data.main.humidity
  const windSpeed = data.wind.speed

  let score = 0
  let conditions = []

  // Temperature check (ideal 15-25°C)
  if (temp >= 15 && temp <= 25) {
    score += 3
    conditions.push('✓ Ideal temperature for planting')
  } else if (temp > 30) {
    conditions.push('⚠ High temperature - consider evening planting')
  } else if (temp < 10) {
    conditions.push('❌ Too cold for most crops')
  }

  // Humidity check
  if (humidity >= 40 && humidity <= 70) {
    score += 2
    conditions.push('✓ Good humidity levels')
  } else if (humidity > 80) {
    conditions.push('⚠ High humidity - fungal risk')
  }

  // Wind check
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

function getPestManagement(data: any) {
  const temp = data.main.temp
  const humidity = data.main.humidity

  let riskLevel = 'Low'
  let recommendations = []
  let color = 'green'

  // High temperature + high humidity = pest risk
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

function getHarvestingConditions(data: any) {
  const humidity = data.main.humidity
  const rain = data.rain?.['1h'] || 0
  const windSpeed = data.wind.speed

  let suitability = 'Good'
  let advice = []
  let color = 'green'

  if (rain > 0) {
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

function generateFarmingAlerts(data: any) {
  const alerts = []
  const temp = data.main.temp
  const humidity = data.main.humidity
  const windSpeed = data.wind.speed
  const rain = data.rain?.['1h'] || 0

  // Temperature alerts
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

  // Rain alerts
  if (rain > 10) {
    alerts.push({
      type: 'heavy-rain',
      severity: 'medium',
      message: 'Heavy rainfall - check drainage systems',
      icon: '🌧️'
    })
  }

  // Wind alerts
  if (windSpeed > 15) {
    alerts.push({
      type: 'strong-wind',
      severity: 'medium',
      message: 'Strong winds - secure equipment and structures',
      icon: '💨'
    })
  }

  // Combined conditions
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