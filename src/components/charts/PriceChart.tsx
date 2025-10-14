'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface PriceData {
  month: string
  price: number
  volume: number
  trend: string
}

interface PriceChartProps {
  data: PriceData[]
  commodity: string
  type?: 'line' | 'bar'
  showVolume?: boolean
}

export default function PriceChart({ data, commodity, type = 'line', showVolume = true }: PriceChartProps) {
  const chartRef = useRef<ChartJS<'line' | 'bar'>>(null)

  const chartData = {
    labels: data.map(d => d.month),
    datasets: [
      {
        label: `${commodity} Price (₹/Quintal)`,
        data: data.map(d => d.price),
        borderColor: 'rgb(34, 197, 94)',
        backgroundColor: type === 'line' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(34, 197, 94, 0.8)',
        borderWidth: 3,
        fill: type === 'line',
        tension: 0.4,
        pointBackgroundColor: 'rgb(34, 197, 94)',
        pointBorderColor: 'rgb(255, 255, 255)',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        yAxisID: 'y',
      },
      ...(showVolume ? [{
        label: 'Trading Volume (Tonnes)',
        data: data.map(d => d.volume),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderWidth: 2,
        yAxisID: 'y1',
        type: 'bar' as const,
      }] : [])
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      title: {
        display: true,
        text: `${commodity} Price Trend - Last 6 Months`,
        font: {
          size: 16,
          weight: 'bold' as const,
        },
        color: '#1f2937',
      },
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: 'rgb(34, 197, 94)',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          title: (context: any) => {
            return `${context[0].label}`
          },
          label: (context: any) => {
            if (context.datasetIndex === 0) {
              return `Price: ₹${context.parsed.y.toLocaleString()}/quintal`
            } else {
              return `Volume: ${context.parsed.y.toLocaleString()} tonnes`
            }
          },
          afterBody: (context: any) => {
            const dataIndex = context[0].dataIndex
            const trend = data[dataIndex]?.trend
            if (trend) {
              const trendIcon = trend === 'up' ? '📈' : trend === 'down' ? '📉' : '➡️'
              return [`Trend: ${trendIcon} ${trend}`]
            }
            return []
          },
        },
      },
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: 'Month',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Price (₹/Quintal)',
          font: {
            size: 12,
            weight: 'bold' as const,
          },
          color: 'rgb(34, 197, 94)',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: function(value: any) {
            return '₹' + value.toLocaleString()
          },
        },
      },
      ...(showVolume ? {
        y1: {
          type: 'linear' as const,
          display: true,
          position: 'right' as const,
          title: {
            display: true,
            text: 'Volume (Tonnes)',
            font: {
              size: 12,
              weight: 'bold' as const,
            },
            color: 'rgb(59, 130, 246)',
          },
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: function(value: any) {
              return value.toLocaleString() + 'T'
            },
          },
        },
      } : {}),
    },
  }

  useEffect(() => {
    const chart = chartRef.current
    if (chart) {
      chart.update('show')
    }
  }, [data])

  const ChartComponent = type === 'line' ? Line : Bar

  return (
    <div className="relative w-full h-full min-h-[300px] sm:min-h-[400px]">
      <ChartComponent
        ref={chartRef}
        data={chartData}
        options={options}
      />
    </div>
  )
}