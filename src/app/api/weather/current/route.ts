import { NextRequest, NextResponse } from 'next/server'

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

    // Geocode if needed
    if (city && (!lat || !lon)) {
      // Forward geocoding: city name to coordinates
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
      // Reverse geocoding: coordinates to city name
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
        // Continue with default location name
      }
    }

    // Fetch from NASA POWER API - get last 7 days for recent data
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - 7)
    const endDate = new Date(today)
    endDate.setDate(today.getDate() - 1)

    const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '')
    const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '')

    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,PRECTOTCORR&community=AG&longitude=${longitude}&latitude=${latitude}&start=${startDateStr}&end=${endDateStr}&format=JSON`

    const response = await fetch(nasaUrl)

    if (!response.ok) {
      console.error('NASA API error:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch weather data from NASA API' },
        { status: response.status }
      )
    }

    const data = await response.json()

    // Validate response
    if (!data.properties || !data.properties.parameter) {
      return NextResponse.json(
        { error: 'Invalid NASA API response' },
        { status: 500 }
      )
    }

    const parameters = data.properties.parameter
    const dates = Object.keys(parameters.T2M).sort().reverse()
    const recentDate = dates[0]

    // Clean NASA data (-999 values)
    const cleanValue = (value: number, defaultValue: number = 0) => {
      if (value === undefined || value === null || value < -900) {
        return defaultValue
      }
      return value
    }

    const temp = cleanValue(parameters.T2M[recentDate], 25)
    const tempMax = cleanValue(parameters.T2M_MAX?.[recentDate], temp + 5)
    const tempMin = cleanValue(parameters.T2M_MIN?.[recentDate], temp - 5)
    const humidity = cleanValue(parameters.RH2M?.[recentDate], 50)
    const windSpeed = cleanValue(parameters.WS2M?.[recentDate], 10)
    const rainfall = cleanValue(parameters.PRECTOTCORR?.[recentDate], 0)

    // Get weather description based on conditions
    const getWeatherDescription = (temp: number, rain: number) => {
      if (rain > 5) return { main: 'Rain', description: 'rainy', icon: '10d' }
      if (rain > 0) return { main: 'Rain', description: 'light rain', icon: '09d' }
      if (temp > 35) return { main: 'Clear', description: 'hot and sunny', icon: '01d' }
      if (temp > 28) return { main: 'Clear', description: 'sunny', icon: '01d' }
      if (temp > 22) return { main: 'Clouds', description: 'partly cloudy', icon: '02d' }
      return { main: 'Clouds', description: 'cloudy', icon: '03d' }
    }

    const weather = getWeatherDescription(temp, rainfall)

    // Mock data for fields not available in NASA API
    const mockData = {
      pressure: 1013,
      visibility: 10,
      uvIndex: temp > 30 ? 8 : temp > 25 ? 6 : 4,
      windDirection: 180,
      cloudiness: rainfall > 0 ? 80 : temp > 30 ? 10 : 40
    }

    // Transform data for farming context
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
        feelsLike: Math.round(temp + (humidity > 70 ? 2 : -2)),
        humidity: Math.round(humidity),
        pressure: mockData.pressure,
        windSpeed: Math.round(windSpeed * 3.6), // m/s to km/h
        windDirection: mockData.windDirection,
        visibility: mockData.visibility,
        uvIndex: mockData.uvIndex,
        description: weather.description,
        icon: weather.icon,
        cloudiness: mockData.cloudiness
      },
      farming: {
        irrigationAdvice: getIrrigationAdvice({ temp, humidity, rainfall }),
        plantingConditions: getPlantingConditions({ temp, humidity, windSpeed }),
        pestManagement: getPestManagement({ temp, humidity }),
        harvestingConditions: getHarvestingConditions({ humidity, rainfall, windSpeed })
      },
      alerts: generateFarmingAlerts({ temp, humidity, windSpeed, rainfall }),
      timestamp: new Date().toISOString(),
      source: 'NASA POWER API'
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

function getPestManagement(data: { temp: number; humidity: number }) {
  const { temp, humidity } = data
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
  if (rainfall > 10) {
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
