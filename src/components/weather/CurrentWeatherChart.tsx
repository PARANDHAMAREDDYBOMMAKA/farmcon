'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Doughnut, Radar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  RadialLinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface CurrentWeatherChartProps {
  data: {
    temperature: number
    feelsLike: number
    humidity: number
    pressure: number
    windSpeed: number
    visibility: number
    cloudiness: number
    uvIndex?: number
  }
}

export default function CurrentWeatherChart({ data }: CurrentWeatherChartProps) {
  if (!data) {
    return <div className="p-4 text-gray-500">No chart data available</div>
  }

  // Radar chart for overall conditions
  const radarData = {
    labels: ['Temperature', 'Humidity', 'Wind', 'Visibility', 'Pressure'],
    datasets: [
      {
        label: 'Current Conditions',
        data: [
          (data.temperature / 50) * 100, // Normalize to 100
          data.humidity,
          (data.windSpeed / 50) * 100, // Normalize to 100
          (data.visibility / 10) * 100, // Normalize to 100
          ((data.pressure - 900) / 200) * 100 // Normalize pressure range 900-1100 to 0-100
        ],
        backgroundColor: 'rgba(34, 197, 94, 0.2)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(34, 197, 94, 1)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgba(34, 197, 94, 1)'
      }
    ]
  }

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)'
        },
        suggestedMin: 0,
        suggestedMax: 100,
        ticks: {
          stepSize: 20,
          backdropColor: 'transparent'
        },
        pointLabels: {
          font: {
            size: 12
          }
        }
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.label || ''
            const value = context.parsed.r

            // Denormalize values for display
            if (label === 'Temperature') return `${label}: ${Math.round((value / 100) * 50)}°C`
            if (label === 'Humidity') return `${label}: ${Math.round(value)}%`
            if (label === 'Wind') return `${label}: ${Math.round((value / 100) * 50)} km/h`
            if (label === 'Visibility') return `${label}: ${Math.round((value / 100) * 10)} km`
            if (label === 'Pressure') return `${label}: ${Math.round(900 + (value / 100) * 200)} hPa`
            return `${label}: ${Math.round(value)}`
          }
        }
      }
    }
  }

  // Doughnut chart for humidity vs dry air
  const humidityData = {
    labels: ['Humidity', 'Dry Air'],
    datasets: [
      {
        data: [data.humidity, 100 - data.humidity],
        backgroundColor: [
          'rgba(59, 130, 246, 0.8)',
          'rgba(229, 231, 235, 0.4)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(209, 213, 219, 1)'
        ],
        borderWidth: 2
      }
    ]
  }

  // Doughnut chart for cloudiness
  const cloudinessData = {
    labels: ['Cloud Cover', 'Clear Sky'],
    datasets: [
      {
        data: [data.cloudiness, 100 - data.cloudiness],
        backgroundColor: [
          'rgba(107, 114, 128, 0.8)',
          'rgba(147, 197, 253, 0.4)'
        ],
        borderColor: [
          'rgba(75, 85, 99, 1)',
          'rgba(59, 130, 246, 1)'
        ],
        borderWidth: 2
      }
    ]
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          font: {
            size: 11
          },
          padding: 10
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            return `${context.label}: ${context.parsed}%`
          }
        }
      }
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Radar Chart - Overall Conditions */}
        <div className="lg:col-span-2">
          <h4 className="text-lg font-semibold text-gray-900 mb-4">Weather Conditions Overview</h4>
          <div style={{ height: 350 }}>
            <Radar data={radarData} options={radarOptions} />
          </div>
        </div>

        {/* Doughnut Charts - Specific Metrics */}
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Humidity Level</h4>
            <div style={{ height: 150 }}>
              <Doughnut data={humidityData} options={doughnutOptions} />
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Cloud Coverage</h4>
            <div style={{ height: 150 }}>
              <Doughnut data={cloudinessData} options={doughnutOptions} />
            </div>
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-red-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium">Temperature</p>
          <p className="text-2xl font-bold text-orange-600">{data.temperature}°C</p>
          <p className="text-xs text-gray-500">Feels {data.feelsLike}°C</p>
        </div>

        <div className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium">Humidity</p>
          <p className="text-2xl font-bold text-blue-600">{data.humidity}%</p>
          <p className="text-xs text-gray-500">
            {data.humidity > 70 ? 'High' : data.humidity > 40 ? 'Normal' : 'Low'}
          </p>
        </div>

        <div className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium">Wind Speed</p>
          <p className="text-2xl font-bold text-green-600">{data.windSpeed}</p>
          <p className="text-xs text-gray-500">km/h</p>
        </div>

        <div className="text-center p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
          <p className="text-xs text-gray-600 font-medium">Pressure</p>
          <p className="text-2xl font-bold text-purple-600">{data.pressure}</p>
          <p className="text-xs text-gray-500">hPa</p>
        </div>
      </div>
    </div>
  )
}
