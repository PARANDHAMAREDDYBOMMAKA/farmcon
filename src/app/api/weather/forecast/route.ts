import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const city = searchParams.get('city')
    const days = Math.min(parseInt(searchParams.get('days') || '7'), 30) // Support up to 30 days

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

    // If city is provided, geocode it
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

    // Fetch from NASA POWER API - get last N days for historical forecast
    const today = new Date()
    const startDate = new Date(today)
    startDate.setDate(today.getDate() - days)
    const endDate = new Date(today)
    endDate.setDate(today.getDate() - 1)

    const startDateStr = startDate.toISOString().split('T')[0].replace(/-/g, '')
    const endDateStr = endDate.toISOString().split('T')[0].replace(/-/g, '')

    const nasaUrl = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,RH2M,WS2M,PRECTOTCORR&community=AG&longitude=${longitude}&latitude=${latitude}&start=${startDateStr}&end=${endDateStr}&format=JSON`

    const response = await fetch(nasaUrl)

    if (!response.ok) {
      console.error('NASA API error:', response.status)
      return NextResponse.json(
        { error: 'Failed to fetch weather forecast from NASA API' },
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

    // Log raw NASA data for debugging (first date only)
    const firstDate = dates[0]
    console.log('🔍 Raw NASA forecast data for', locationName, '(first day):', {
      date: firstDate,
      T2M: parameters.T2M[firstDate],
      T2M_MAX: parameters.T2M_MAX?.[firstDate],
      RH2M: parameters.RH2M?.[firstDate],
      WS2M: parameters.WS2M?.[firstDate]
    })

    // Clean NASA data (-999 values indicate missing data)
    const cleanValue = (value: number, defaultValue: number = 0) => {
      if (value === undefined || value === null || value < -900) {
        return { value: defaultValue, isDefault: true }
      }
      return { value, isDefault: false }
    }

    // Check first day to see if NASA has data for this location
    const firstDayTemp = cleanValue(parameters.T2M[firstDate], 25)
    const firstDayHumidity = cleanValue(parameters.RH2M?.[firstDate], 50)
    const firstDayWind = cleanValue(parameters.WS2M?.[firstDate], 10)

    const defaultCount = [
      firstDayTemp.isDefault,
      firstDayHumidity.isDefault,
      firstDayWind.isDefault
    ].filter(Boolean).length

    // If 2 out of 3 key values are defaults, NASA doesn't have data
    if (defaultCount >= 2) {
      console.warn('⚠️ NASA API has insufficient forecast data for', locationName, '- using mock data')
      return NextResponse.json({
        forecast: generateMockForecast(locationName, country, parseFloat(latitude!), parseFloat(longitude!), days),
        source: 'mock',
        reason: 'NASA POWER API does not have sufficient data for this location'
      })
    }

    // Process daily forecasts
    const dailyForecasts = dates.slice(0, Math.min(days, dates.length)).map((dateStr) => {
      const temp = cleanValue(parameters.T2M[dateStr], 25).value
      const tempMax = cleanValue(parameters.T2M_MAX?.[dateStr], temp + 5).value
      const tempMin = cleanValue(parameters.T2M_MIN?.[dateStr], temp - 5).value
      const humidity = cleanValue(parameters.RH2M?.[dateStr], 50).value
      const windSpeed = cleanValue(parameters.WS2M?.[dateStr], 10).value
      const rainfall = cleanValue(parameters.PRECTOTCORR?.[dateStr], 0).value

      // Convert NASA date format (YYYYMMDD) to ISO format
      const year = dateStr.substring(0, 4)
      const month = dateStr.substring(4, 6)
      const day = dateStr.substring(6, 8)
      const formattedDate = `${year}-${month}-${day}`

      const getWeatherDescription = (temp: number, rain: number) => {
        if (rain > 5) return { main: 'Rain', description: 'rainy', icon: '10d' }
        if (rain > 0) return { main: 'Rain', description: 'light rain', icon: '09d' }
        if (temp > 35) return { main: 'Clear', description: 'hot and sunny', icon: '01d' }
        if (temp > 28) return { main: 'Clear', description: 'sunny', icon: '01d' }
        if (temp > 22) return { main: 'Clouds', description: 'partly cloudy', icon: '02d' }
        return { main: 'Clouds', description: 'cloudy', icon: '03d' }
      }

      const weather = getWeatherDescription(temp, rainfall)

      return {
        date: formattedDate,
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
      forecasts: dailyForecasts.map(day => ({
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
          speed: Math.round(day.windSpeed * 3.6), // m/s to km/h
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
      source: 'NASA POWER API'
    }

    return NextResponse.json({ forecast: forecastData })
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

  // Rain check
  if (day.rainfall === 0) {
    score += 3
    factors.push('✓ No rain expected')
  } else if (day.rainfall < 2) {
    score += 1
    factors.push('⚠ Light rain possible')
  } else {
    factors.push('❌ Rain expected - avoid field work')
  }

  // Temperature check
  if (day.tempMax >= 15 && day.tempMax <= 30) {
    score += 2
    factors.push('✓ Comfortable working temperature')
  } else if (day.tempMax > 35) {
    factors.push('⚠ Very hot - work during cooler hours')
  } else if (day.tempMax < 10) {
    factors.push('⚠ Cold conditions')
  }

  // Wind check
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

  // Heat stress
  if (day.tempMax > 40) {
    stressScore += 3
    stressFactors.push('Extreme heat stress')
  } else if (day.tempMax > 35) {
    stressScore += 2
    stressFactors.push('High temperature stress')
  }

  // Cold stress
  if (day.tempMin < 5) {
    stressScore += 2
    stressFactors.push('Cold stress risk')
  }

  // Water stress
  if (day.rainfall === 0 && day.humidity < 30) {
    stressScore += 2
    stressFactors.push('Water stress likely')
  }

  // Wind stress
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

  // Rain analysis
  const totalRain = forecasts.reduce((sum, day) => sum + day.rainfall, 0)
  const rainyDays = forecasts.filter(day => day.rainfall > 1).length

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

  // Temperature analysis
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

  // Best work days
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

// Generate mock forecast data with realistic random values
function generateMockForecast(locationName: string, country: string, lat: number, lon: number, days: number) {
  const baseTemp = 30 - Math.abs(lat) * 0.5 // Base temp from latitude

  const forecasts = []
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - days + i + 1) // Historical dates

    // Add daily variation
    const dailyTempVariation = Math.random() * 8 - 4
    const temp = Math.max(5, Math.min(45, baseTemp + dailyTempVariation))
    const tempMax = temp + Math.random() * 5
    const tempMin = temp - Math.random() * 5
    const humidity = 40 + Math.random() * 50
    const windSpeed = 5 + Math.random() * 15
    const rainfall = Math.random() < 0.7 ? 0 : Math.random() * 10

    const getWeatherDescription = (temp: number, rain: number) => {
      if (rain > 5) return { main: 'Rain', description: 'rainy', icon: '10d' }
      if (rain > 0) return { main: 'Rain', description: 'light rain', icon: '09d' }
      if (temp > 35) return { main: 'Clear', description: 'hot and sunny', icon: '01d' }
      if (temp > 28) return { main: 'Clear', description: 'sunny', icon: '01d' }
      if (temp > 22) return { main: 'Clouds', description: 'partly cloudy', icon: '02d' }
      return { main: 'Clouds', description: 'cloudy', icon: '03d' }
    }

    const weather = getWeatherDescription(temp, rainfall)

    forecasts.push({
      date: date.toISOString().split('T')[0],
      temperature: {
        min: Math.round(tempMin),
        max: Math.round(tempMax),
        avg: Math.round(temp)
      },
      humidity: {
        min: Math.round(humidity - 10),
        max: Math.round(humidity + 10),
        avg: Math.round(humidity)
      },
      weather: {
        main: weather.main,
        description: weather.description,
        icon: weather.icon
      },
      wind: {
        speed: Math.round(windSpeed),
        direction: Math.round(Math.random() * 360)
      },
      rain: rainfall,
      farming: {
        irrigationRecommendation: getDailyIrrigationRecommendation({ tempMax, humidity, rainfall }),
        fieldWorkSuitability: getFieldWorkSuitability({ rainfall, tempMax, windSpeed }),
        cropStressLevel: getCropStressLevel({ tempMax, tempMin, rainfall, humidity, windSpeed })
      }
    })
  }

  return {
    location: {
      name: locationName,
      country: country,
      coordinates: { lat, lon }
    },
    forecasts,
    farmingInsights: generateWeeklyFarmingInsights(forecasts.map(f => ({
      tempMax: f.temperature.max,
      tempMin: f.temperature.min,
      rainfall: f.rain,
      windSpeed: f.wind.speed
    }))),
    timestamp: new Date().toISOString()
  }
}
