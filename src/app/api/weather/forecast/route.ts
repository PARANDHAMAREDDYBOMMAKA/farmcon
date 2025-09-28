import { NextRequest, NextResponse } from 'next/server'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || 'demo-key'
const OPENWEATHER_BASE_URL = 'https://api.openweathermap.org/data/2.5'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = searchParams.get('lat')
    const lon = searchParams.get('lon')
    const city = searchParams.get('city')
    const days = parseInt(searchParams.get('days') || '5')

    if (!lat && !lon && !city) {
      return NextResponse.json(
        { error: 'Either latitude/longitude or city name is required' },
        { status: 400 }
      )
    }

    let url = `${OPENWEATHER_BASE_URL}/forecast?appid=${OPENWEATHER_API_KEY}&units=metric`

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

    // Group forecasts by day and get daily summaries
    const dailyForecasts = groupForecastsByDay(data.list, days)

    const forecastData = {
      location: {
        name: data.city.name,
        country: data.city.country,
        coordinates: {
          lat: data.city.coord.lat,
          lon: data.city.coord.lon
        }
      },
      forecasts: dailyForecasts.map(day => ({
        date: day.date,
        temperature: {
          min: Math.round(day.tempMin),
          max: Math.round(day.tempMax),
          avg: Math.round(day.tempAvg)
        },
        humidity: {
          min: day.humidityMin,
          max: day.humidityMax,
          avg: Math.round(day.humidityAvg)
        },
        weather: {
          main: day.mainWeather,
          description: day.description,
          icon: day.icon
        },
        wind: {
          speed: day.windSpeed,
          direction: day.windDirection
        },
        rain: day.rain,
        farming: {
          irrigationRecommendation: getDailyIrrigationRecommendation(day),
          fieldWorkSuitability: getFieldWorkSuitability(day),
          cropStressLevel: getCropStressLevel(day)
        }
      })),
      farmingInsights: generateWeeklyFarmingInsights(dailyForecasts),
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap'
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

function groupForecastsByDay(forecasts: any[], maxDays: number) {
  const dailyData: { [key: string]: any } = {}

  forecasts.slice(0, maxDays * 8).forEach(forecast => {
    const date = new Date(forecast.dt * 1000).toISOString().split('T')[0]

    if (!dailyData[date]) {
      dailyData[date] = {
        date,
        temps: [],
        humidities: [],
        winds: [],
        weather: [],
        rain: 0
      }
    }

    dailyData[date].temps.push(forecast.main.temp)
    dailyData[date].humidities.push(forecast.main.humidity)
    dailyData[date].winds.push({
      speed: forecast.wind.speed,
      deg: forecast.wind.deg
    })
    dailyData[date].weather.push({
      main: forecast.weather[0].main,
      description: forecast.weather[0].description,
      icon: forecast.weather[0].icon
    })

    if (forecast.rain) {
      dailyData[date].rain += forecast.rain['3h'] || 0
    }
  })

  return Object.values(dailyData).map((day: any) => ({
    date: day.date,
    tempMin: Math.min(...day.temps),
    tempMax: Math.max(...day.temps),
    tempAvg: day.temps.reduce((a: number, b: number) => a + b, 0) / day.temps.length,
    humidityMin: Math.min(...day.humidities),
    humidityMax: Math.max(...day.humidities),
    humidityAvg: day.humidities.reduce((a: number, b: number) => a + b, 0) / day.humidities.length,
    windSpeed: day.winds.reduce((a: number, b: any) => a + b.speed, 0) / day.winds.length,
    windDirection: day.winds[0]?.deg || 0,
    mainWeather: day.weather[0]?.main || 'Clear',
    description: day.weather[0]?.description || 'Clear sky',
    icon: day.weather[0]?.icon || '01d',
    rain: day.rain
  }))
}

function getDailyIrrigationRecommendation(day: any) {
  if (day.rain > 10) {
    return {
      status: 'skip',
      message: 'Heavy rain expected - skip irrigation',
      amount: 0,
      color: 'blue'
    }
  } else if (day.rain > 2) {
    return {
      status: 'reduce',
      message: 'Light rain expected - reduce irrigation by 50%',
      amount: 50,
      color: 'green'
    }
  } else if (day.tempMax > 35 && day.humidityAvg < 40) {
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
  if (day.rain === 0) {
    score += 3
    factors.push('✓ No rain expected')
  } else if (day.rain < 2) {
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
  if (day.rain === 0 && day.humidityAvg < 30) {
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
  const totalRain = forecasts.reduce((sum, day) => sum + day.rain, 0)
  const rainyDays = forecasts.filter(day => day.rain > 1).length

  if (totalRain > 50) {
    insights.push({
      type: 'water-management',
      message: `Heavy rainfall expected (${Math.round(totalRain)}mm). Ensure proper drainage.`,
      icon: '🌧️',
      priority: 'high'
    })
  } else if (totalRain < 5) {
    insights.push({
      type: 'irrigation',
      message: 'Dry period ahead. Plan irrigation schedule carefully.',
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
      message: `${hotDays} hot days expected. Protect crops and increase irrigation.`,
      icon: '🌡️',
      priority: 'high'
    })
  }

  if (coldDays >= 2) {
    insights.push({
      type: 'frost-protection',
      message: `${coldDays} cold days expected. Prepare frost protection measures.`,
      icon: '❄️',
      priority: 'medium'
    })
  }

  // Best work days
  const goodWorkDays = forecasts.filter(day =>
    day.rain < 1 && day.tempMax >= 15 && day.tempMax <= 30 && day.windSpeed < 8
  ).length

  insights.push({
    type: 'field-work',
    message: `${goodWorkDays} optimal days for field operations this week.`,
    icon: '🚜',
    priority: 'low'
  })

  return insights
}