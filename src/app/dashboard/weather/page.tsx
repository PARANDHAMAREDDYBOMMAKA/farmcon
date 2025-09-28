'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

interface WeatherData {
  location: {
    name: string
    country: string
    coordinates: { lat: number; lon: number }
  }
  current: {
    temperature: number
    feelsLike: number
    humidity: number
    pressure: number
    windSpeed: number
    windDirection: number
    visibility: number
    description: string
    icon: string
    cloudiness: number
  }
  farming: {
    irrigationAdvice: {
      status: string
      message: string
      color: string
    }
    plantingConditions: {
      score: string
      rating: string
      conditions: string[]
      color: string
    }
    pestManagement: {
      riskLevel: string
      recommendations: string[]
      color: string
    }
    harvestingConditions: {
      suitability: string
      advice: string[]
      color: string
    }
  }
  alerts: Array<{
    type: string
    severity: string
    message: string
    icon: string
  }>
}

interface ForecastData {
  location: {
    name: string
    country: string
  }
  forecasts: Array<{
    date: string
    temperature: { min: number; max: number; avg: number }
    humidity: { min: number; max: number; avg: number }
    weather: { main: string; description: string; icon: string }
    wind: { speed: number; direction: number }
    rain: number
    farming: {
      irrigationRecommendation: {
        status: string
        message: string
        amount: number
        color: string
      }
      fieldWorkSuitability: {
        score: string
        rating: string
        factors: string[]
        color: string
      }
      cropStressLevel: {
        level: string
        score: number
        factors: string[]
        color: string
      }
    }
  }>
  farmingInsights: Array<{
    type: string
    message: string
    icon: string
    priority: string
  }>
}

export default function WeatherPage() {
  const { user } = useAuth()
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastData | null>(null)
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState({ lat: 28.6139, lon: 77.2090 }) // Default: Delhi
  const [city, setCity] = useState('Delhi')
  const [activeTab, setActiveTab] = useState<'current' | 'forecast'>('current')

  useEffect(() => {
    // Try to get user's location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          })
          loadWeatherData(position.coords.latitude, position.coords.longitude)
        },
        () => {
          // If geolocation fails, use default location
          loadWeatherData(location.lat, location.lon)
        }
      )
    } else {
      loadWeatherData(location.lat, location.lon)
    }
  }, [])

  const loadWeatherData = async (lat?: number, lon?: number, cityName?: string) => {
    setLoading(true)
    try {
      // Load current weather
      let weatherUrl = '/api/weather/current?'
      if (lat && lon) {
        weatherUrl += `lat=${lat}&lon=${lon}`
      } else if (cityName) {
        weatherUrl += `city=${encodeURIComponent(cityName)}`
      }

      const weatherResponse = await fetch(weatherUrl)
      if (weatherResponse.ok) {
        const weatherData = await weatherResponse.json()
        setCurrentWeather(weatherData.weather)
      } else {
        toast.error('Failed to load current weather data')
      }

      // Load forecast
      let forecastUrl = '/api/weather/forecast?'
      if (lat && lon) {
        forecastUrl += `lat=${lat}&lon=${lon}&days=5`
      } else if (cityName) {
        forecastUrl += `city=${encodeURIComponent(cityName)}&days=5`
      }

      const forecastResponse = await fetch(forecastUrl)
      if (forecastResponse.ok) {
        const forecastData = await forecastResponse.json()
        setForecast(forecastData.forecast)
      } else {
        toast.error('Failed to load weather forecast')
      }
    } catch (error) {
      console.error('Weather data error:', error)
      toast.error('Failed to load weather data')
    } finally {
      setLoading(false)
    }
  }

  const handleCitySearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (city.trim()) {
      loadWeatherData(undefined, undefined, city.trim())
    }
  }

  const getAdviceColor = (color: string) => {
    switch (color) {
      case 'red': return 'text-red-600 bg-red-100'
      case 'yellow': return 'text-yellow-600 bg-yellow-100'
      case 'green': return 'text-green-600 bg-green-100'
      case 'blue': return 'text-blue-600 bg-blue-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-100 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-100 border-blue-200'
      default: return 'text-gray-600 bg-gray-100 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading weather data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agricultural Weather</h1>
            <p className="text-gray-600 mt-1">Real-time weather data and farming insights</p>
          </div>
          <form onSubmit={handleCitySearch} className="mt-4 sm:mt-0 flex space-x-2">
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name..."
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-green-500 focus:border-green-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              🔍
            </button>
          </form>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'current'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Current Weather
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'forecast'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              5-Day Forecast
            </button>
          </nav>
        </div>

        {/* Current Weather Tab */}
        {activeTab === 'current' && currentWeather && (
          <div className="p-6 space-y-6">
            {/* Location and Basic Weather */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{currentWeather.location.name}</h3>
                      <p className="text-blue-100">{currentWeather.location.country}</p>
                      <div className="mt-4">
                        <div className="text-3xl font-bold">{currentWeather.current.temperature}°C</div>
                        <p className="text-blue-100">Feels like {currentWeather.current.feelsLike}°C</p>
                        <p className="text-blue-100 capitalize">{currentWeather.current.description}</p>
                      </div>
                    </div>
                    <div className="text-4xl">🌤️</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">💧</span>
                      <div>
                        <p className="text-sm text-gray-600">Humidity</p>
                        <p className="text-lg font-semibold">{currentWeather.current.humidity}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">💨</span>
                      <div>
                        <p className="text-sm text-gray-600">Wind Speed</p>
                        <p className="text-lg font-semibold">{currentWeather.current.windSpeed} m/s</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">🌡️</span>
                      <div>
                        <p className="text-sm text-gray-600">Pressure</p>
                        <p className="text-lg font-semibold">{currentWeather.current.pressure} hPa</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl">👁️</span>
                      <div>
                        <p className="text-sm text-gray-600">Visibility</p>
                        <p className="text-lg font-semibold">{currentWeather.current.visibility} km</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Alerts */}
            {currentWeather.alerts && currentWeather.alerts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Weather Alerts</h3>
                {currentWeather.alerts.map((alert, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{alert.icon}</span>
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm opacity-75">Severity: {alert.severity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Farming Insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Irrigation Advice */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">💧</span>
                  Irrigation Advice
                </h4>
                <div className={`px-3 py-2 rounded-md ${getAdviceColor(currentWeather.farming.irrigationAdvice.color)}`}>
                  <p className="font-medium capitalize">{currentWeather.farming.irrigationAdvice.status}</p>
                  <p className="text-sm mt-1">{currentWeather.farming.irrigationAdvice.message}</p>
                </div>
              </div>

              {/* Planting Conditions */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🌱</span>
                  Planting Conditions
                </h4>
                <div className={`px-3 py-2 rounded-md ${getAdviceColor(currentWeather.farming.plantingConditions.color)}`}>
                  <p className="font-medium">{currentWeather.farming.plantingConditions.rating} ({currentWeather.farming.plantingConditions.score})</p>
                  <div className="text-sm mt-2 space-y-1">
                    {currentWeather.farming.plantingConditions.conditions.map((condition, index) => (
                      <p key={index}>{condition}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pest Management */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🐛</span>
                  Pest Risk
                </h4>
                <div className={`px-3 py-2 rounded-md ${getAdviceColor(currentWeather.farming.pestManagement.color)}`}>
                  <p className="font-medium">{currentWeather.farming.pestManagement.riskLevel} Risk</p>
                  <div className="text-sm mt-2 space-y-1">
                    {currentWeather.farming.pestManagement.recommendations.map((rec, index) => (
                      <p key={index}>• {rec}</p>
                    ))}
                  </div>
                </div>
              </div>

              {/* Harvesting Conditions */}
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🌾</span>
                  Harvesting Conditions
                </h4>
                <div className={`px-3 py-2 rounded-md ${getAdviceColor(currentWeather.farming.harvestingConditions.color)}`}>
                  <p className="font-medium">{currentWeather.farming.harvestingConditions.suitability}</p>
                  <div className="text-sm mt-2 space-y-1">
                    {currentWeather.farming.harvestingConditions.advice.map((advice, index) => (
                      <p key={index}>• {advice}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Tab */}
        {activeTab === 'forecast' && forecast && (
          <div className="p-6 space-y-6">
            {/* Farming Insights */}
            {forecast.farmingInsights && forecast.farmingInsights.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-gray-900">Weekly Farming Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forecast.farmingInsights.map((insight, index) => (
                    <div key={index} className={`border rounded-lg p-4 ${
                      insight.priority === 'high' ? 'border-red-200 bg-red-50' :
                      insight.priority === 'medium' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }`}>
                      <div className="flex items-start space-x-3">
                        <span className="text-2xl">{insight.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900">{insight.message}</p>
                          <p className="text-xs text-gray-500 mt-1">Priority: {insight.priority}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5-Day Forecast */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">5-Day Forecast</h3>
              <div className="space-y-4">
                {forecast.forecasts.map((day, index) => (
                  <div key={index} className="border rounded-lg p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {/* Date and Weather */}
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {new Date(day.date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </h4>
                        <div className="flex items-center space-x-3 mt-2">
                          <span className="text-2xl">🌤️</span>
                          <div>
                            <p className="font-medium">{day.temperature.max}°C / {day.temperature.min}°C</p>
                            <p className="text-sm text-gray-600 capitalize">{day.weather.description}</p>
                          </div>
                        </div>
                        {day.rain > 0 && (
                          <p className="text-sm text-blue-600 mt-2">🌧️ Rain: {day.rain}mm</p>
                        )}
                      </div>

                      {/* Irrigation */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">💧 Irrigation</h5>
                        <div className={`px-3 py-2 rounded-md text-sm ${getAdviceColor(day.farming.irrigationRecommendation.color)}`}>
                          <p className="font-medium capitalize">{day.farming.irrigationRecommendation.status}</p>
                          <p>{day.farming.irrigationRecommendation.message}</p>
                          {day.farming.irrigationRecommendation.amount !== 100 && (
                            <p className="mt-1">Amount: {day.farming.irrigationRecommendation.amount}%</p>
                          )}
                        </div>
                      </div>

                      {/* Field Work */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">🚜 Field Work</h5>
                        <div className={`px-3 py-2 rounded-md text-sm ${getAdviceColor(day.farming.fieldWorkSuitability.color)}`}>
                          <p className="font-medium">{day.farming.fieldWorkSuitability.rating}</p>
                          <p className="text-xs mt-1">Score: {day.farming.fieldWorkSuitability.score}</p>
                          <div className="mt-1 space-y-1">
                            {day.farming.fieldWorkSuitability.factors.slice(0, 2).map((factor, i) => (
                              <p key={i} className="text-xs">{factor}</p>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Crop Stress */}
                      <div>
                        <h5 className="font-medium text-gray-700 mb-2">🌿 Crop Stress</h5>
                        <div className={`px-3 py-2 rounded-md text-sm ${getAdviceColor(day.farming.cropStressLevel.color)}`}>
                          <p className="font-medium">{day.farming.cropStressLevel.level} Stress</p>
                          <div className="mt-1 space-y-1">
                            {day.farming.cropStressLevel.factors.slice(0, 2).map((factor, i) => (
                              <p key={i} className="text-xs">{factor}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}