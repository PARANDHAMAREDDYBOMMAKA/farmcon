'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import WeatherChart from '@/components/weather/WeatherChart'
import CurrentWeatherChart from '@/components/weather/CurrentWeatherChart'

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
  const [location, setLocation] = useState({ lat: 28.6139, lon: 77.2090 }) 
  const [city, setCity] = useState('Delhi')
  const [activeTab, setActiveTab] = useState<'current' | 'forecast'>('current')
  const [currentView, setCurrentView] = useState<'details' | 'charts'>('details')
  const [forecastView, setForecastView] = useState<'list' | 'charts'>('list')
  const [forecastDays, setForecastDays] = useState(5)

  useEffect(() => {
    
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

        if (weatherData.source === 'mock') {
          toast.error('Unable to fetch live weather data. Showing sample data.', {
            duration: 4000,
            icon: '⚠️'
          })
          console.warn('Weather source:', weatherData.source, weatherData.error)
        } else {
          toast.success('Weather data loaded successfully', {
            duration: 2000,
            icon: '🌤️'
          })
        }
      } else {
        toast.error('Failed to load current weather data')
      }

      let forecastUrl = '/api/weather/forecast?'
      if (lat && lon) {
        forecastUrl += `lat=${lat}&lon=${lon}&days=${forecastDays}`
      } else if (cityName) {
        forecastUrl += `city=${encodeURIComponent(cityName)}&days=${forecastDays}`
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
          <p className="mt-4 text-black">Loading weather data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Agricultural Weather</h1>
            <p className="text-black mt-1">Real-time weather data and farming insights</p>
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

      {}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('current')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'current'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-black hover:text-black hover:border-gray-300'
              }`}
            >
              Current Weather
            </button>
            <button
              onClick={() => setActiveTab('forecast')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'forecast'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-black hover:text-black hover:border-gray-300'
              }`}
            >
              {forecastDays}-Day Forecast
            </button>
          </nav>
        </div>

        {}
        {activeTab === 'current' && currentWeather && (
          <div className="p-6 space-y-6">
            {}
            <div className="flex justify-end mb-4">
              <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                <button
                  onClick={() => setCurrentView('details')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'details'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📊 Details
                </button>
                <button
                  onClick={() => setCurrentView('charts')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentView === 'charts'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📈 Charts
                </button>
              </div>
            </div>

            {}
            {currentView === 'charts' && (
              <CurrentWeatherChart data={{
                temperature: currentWeather.current.temperature,
                feelsLike: currentWeather.current.feelsLike,
                humidity: currentWeather.current.humidity,
                pressure: currentWeather.current.pressure,
                windSpeed: currentWeather.current.windSpeed,
                visibility: currentWeather.current.visibility,
                cloudiness: currentWeather.current.cloudiness,
                uvIndex: (currentWeather.current as any).uvIndex || 5
              }} />
            )}

            {}
            {currentView === 'details' && (
              <>
            {}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white rounded-xl shadow-lg p-6 transform transition-all hover:scale-105">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white">{currentWeather.location.name}</h3>
                      <p className="text-blue-100 text-sm">{currentWeather.location.country}</p>
                      <div className="mt-6">
                        <div className="text-5xl font-bold text-white">{currentWeather.current.temperature}°C</div>
                        <p className="text-blue-100 text-sm mt-1">Feels like {currentWeather.current.feelsLike}°C</p>
                        <p className="text-white capitalize font-medium mt-2">{currentWeather.current.description}</p>
                      </div>
                    </div>
                    <div className="text-6xl animate-bounce">🌤️</div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow border border-cyan-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">💧</span>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Humidity</p>
                        <p className="text-2xl font-bold text-cyan-700">{currentWeather.current.humidity}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">💨</span>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Wind Speed</p>
                        <p className="text-2xl font-bold text-gray-700">{currentWeather.current.windSpeed} km/h</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow border border-orange-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">🌡️</span>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Pressure</p>
                        <p className="text-2xl font-bold text-orange-700">{currentWeather.current.pressure} hPa</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 shadow-md hover:shadow-lg transition-shadow border border-purple-200">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">👁️</span>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Visibility</p>
                        <p className="text-2xl font-bold text-purple-700">{currentWeather.current.visibility} km</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {}
            {currentWeather.alerts && currentWeather.alerts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-black">Weather Alerts</h3>
                {currentWeather.alerts.map((alert, index) => (
                  <div key={index} className={`border rounded-lg p-4 ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{alert.icon}</span>
                      <div>
                        <p className="font-medium">{alert.message}</p>
                        <p className="text-sm">Severity: {alert.severity}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {}
              <div className="border-2 border-blue-200 rounded-xl p-5 bg-gradient-to-br from-blue-50 to-white shadow-lg hover:shadow-xl transition-all">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                  <span className="mr-3 text-3xl">💧</span>
                  Irrigation Advice
                </h4>
                <div className={`px-4 py-3 rounded-lg shadow-sm ${getAdviceColor(currentWeather.farming.irrigationAdvice.color)}`}>
                  <p className="font-bold capitalize text-lg">{currentWeather.farming.irrigationAdvice.status}</p>
                  <p className="text-sm mt-2">{currentWeather.farming.irrigationAdvice.message}</p>
                </div>
              </div>

              {}
              <div className="border-2 border-green-200 rounded-xl p-5 bg-gradient-to-br from-green-50 to-white shadow-lg hover:shadow-xl transition-all">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                  <span className="mr-3 text-3xl">🌱</span>
                  Planting Conditions
                </h4>
                <div className={`px-4 py-3 rounded-lg shadow-sm ${getAdviceColor(currentWeather.farming.plantingConditions.color)}`}>
                  <p className="font-bold text-lg">{currentWeather.farming.plantingConditions.rating} ({currentWeather.farming.plantingConditions.score})</p>
                  <div className="text-sm mt-3 space-y-2">
                    {currentWeather.farming.plantingConditions.conditions.map((condition, index) => (
                      <p key={index} className="font-medium">{condition}</p>
                    ))}
                  </div>
                </div>
              </div>

              {}
              <div className="border-2 border-amber-200 rounded-xl p-5 bg-gradient-to-br from-amber-50 to-white shadow-lg hover:shadow-xl transition-all">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                  <span className="mr-3 text-3xl">🐛</span>
                  Pest Risk
                </h4>
                <div className={`px-4 py-3 rounded-lg shadow-sm ${getAdviceColor(currentWeather.farming.pestManagement.color)}`}>
                  <p className="font-bold text-lg">{currentWeather.farming.pestManagement.riskLevel} Risk</p>
                  <div className="text-sm mt-3 space-y-2">
                    {currentWeather.farming.pestManagement.recommendations.map((rec, index) => (
                      <p key={index} className="font-medium">• {rec}</p>
                    ))}
                  </div>
                </div>
              </div>

              {}
              <div className="border-2 border-yellow-200 rounded-xl p-5 bg-gradient-to-br from-yellow-50 to-white shadow-lg hover:shadow-xl transition-all">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                  <span className="mr-3 text-3xl">🌾</span>
                  Harvesting Conditions
                </h4>
                <div className={`px-4 py-3 rounded-lg shadow-sm ${getAdviceColor(currentWeather.farming.harvestingConditions.color)}`}>
                  <p className="font-bold text-lg">{currentWeather.farming.harvestingConditions.suitability}</p>
                  <div className="text-sm mt-3 space-y-2">
                    {currentWeather.farming.harvestingConditions.advice.map((advice, index) => (
                      <p key={index} className="font-medium">• {advice}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {}
        {activeTab === 'forecast' && forecast && (
          <div className="p-6 space-y-6">
            {}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
                <button
                  onClick={() => setForecastView('list')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    forecastView === 'list'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📋 List View
                </button>
                <button
                  onClick={() => setForecastView('charts')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    forecastView === 'charts'
                      ? 'bg-white text-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  📈 Chart View
                </button>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Days:</label>
                <select
                  value={forecastDays}
                  onChange={(e) => {
                    const days = parseInt(e.target.value)
                    setForecastDays(days)
                    loadWeatherData(location.lat, location.lon)
                  }}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-green-500 focus:border-green-500"
                >
                  <option value={5}>5 Days</option>
                  <option value={7}>7 Days</option>
                  <option value={14}>14 Days</option>
                  <option value={30}>30 Days</option>
                </select>
              </div>
            </div>

            {}
            {forecast.farmingInsights && forecast.farmingInsights.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-2xl font-bold text-gray-800 flex items-center">
                  <span className="mr-3 text-3xl">🌾</span>
                  Weekly Farming Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {forecast.farmingInsights.map((insight, index) => (
                    <div key={index} className={`border-2 rounded-xl p-5 shadow-lg hover:shadow-xl transition-all hover:scale-105 ${
                      insight.priority === 'high' ? 'border-red-300 bg-gradient-to-br from-red-50 to-red-100' :
                      insight.priority === 'medium' ? 'border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-100' :
                      'border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100'
                    }`}>
                      <div className="flex items-start space-x-4">
                        <span className="text-4xl">{insight.icon}</span>
                        <div>
                          <p className="font-bold text-gray-800 text-base">{insight.message}</p>
                          <p className={`text-xs font-bold mt-2 inline-block px-2 py-1 rounded ${
                            insight.priority === 'high' ? 'bg-red-200 text-red-800' :
                            insight.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
                            'bg-blue-200 text-blue-800'
                          }`}>Priority: {insight.priority.toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            {forecastView === 'charts' && forecast.forecasts && forecast.forecasts.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-black mb-4">
                  Temperature Overview ({forecastDays} days)
                </h3>
                <WeatherChart data={forecast.forecasts} />
              </div>
            )}

            {}
            {forecastView === 'list' && (
            <div className="space-y-6">
              <h3 className="text-2xl font-bold text-gray-800">{forecastDays}-Day Forecast</h3>
              <div className="space-y-5">
                {forecast.forecasts.map((day, index) => (
                  <div key={index} className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-r from-white to-gray-50 shadow-lg hover:shadow-xl transition-all hover:scale-[1.01]">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                      {}
                      <div className="bg-gradient-to-br from-blue-100 to-blue-50 rounded-lg p-4 shadow-md">
                        <h4 className="font-bold text-gray-800 text-lg">
                          {new Date(day.date).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </h4>
                        <div className="flex items-center space-x-4 mt-3">
                          <span className="text-4xl">🌤️</span>
                          <div>
                            <p className="font-bold text-xl text-blue-700">{day.temperature.max}°C / {day.temperature.min}°C</p>
                            <p className="text-sm text-gray-600 capitalize font-medium">{day.weather.description}</p>
                          </div>
                        </div>
                        {day.rain > 0 && (
                          <p className="text-sm font-bold text-blue-600 mt-3 bg-blue-100 px-2 py-1 rounded-md inline-block">🌧️ Rain: {day.rain}mm</p>
                        )}
                      </div>

                      {}
                      <div className="bg-gradient-to-br from-cyan-50 to-white rounded-lg p-4 shadow-md">
                        <h5 className="font-bold text-gray-800 mb-3 flex items-center">
                          <span className="text-xl mr-2">💧</span> Irrigation
                        </h5>
                        <div className={`px-3 py-3 rounded-lg text-sm shadow-sm ${getAdviceColor(day.farming.irrigationRecommendation.color)}`}>
                          <p className="font-bold capitalize text-base">{day.farming.irrigationRecommendation.status}</p>
                          <p className="font-medium mt-1">{day.farming.irrigationRecommendation.message}</p>
                          {day.farming.irrigationRecommendation.amount !== 100 && (
                            <p className="mt-2 font-bold">Amount: {day.farming.irrigationRecommendation.amount}%</p>
                          )}
                        </div>
                      </div>

                      {}
                      <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-4 shadow-md">
                        <h5 className="font-bold text-gray-800 mb-3 flex items-center">
                          <span className="text-xl mr-2">🚜</span> Field Work
                        </h5>
                        <div className={`px-3 py-3 rounded-lg text-sm shadow-sm ${getAdviceColor(day.farming.fieldWorkSuitability.color)}`}>
                          <p className="font-bold text-base">{day.farming.fieldWorkSuitability.rating}</p>
                          <p className="text-xs mt-1 font-medium">Score: {day.farming.fieldWorkSuitability.score}</p>
                          <div className="mt-2 space-y-1">
                            {day.farming.fieldWorkSuitability.factors.slice(0, 2).map((factor, i) => (
                              <p key={i} className="text-xs font-medium">{factor}</p>
                            ))}
                          </div>
                        </div>
                      </div>

                      {}
                      <div className="bg-gradient-to-br from-amber-50 to-white rounded-lg p-4 shadow-md">
                        <h5 className="font-bold text-gray-800 mb-3 flex items-center">
                          <span className="text-xl mr-2">🌿</span> Crop Stress
                        </h5>
                        <div className={`px-3 py-3 rounded-lg text-sm shadow-sm ${getAdviceColor(day.farming.cropStressLevel.color)}`}>
                          <p className="font-bold text-base">{day.farming.cropStressLevel.level} Stress</p>
                          <div className="mt-2 space-y-1">
                            {day.farming.cropStressLevel.factors.slice(0, 2).map((factor, i) => (
                              <p key={i} className="text-xs font-medium">{factor}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}