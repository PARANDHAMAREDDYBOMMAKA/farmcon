'use client'

import React from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Chart } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  BarController,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

type ForecastDay = {
  date: string
  temperature: { min: number; max: number; avg: number }
  humidity?: { min: number; max: number; avg: number }
  rain?: number
  weather?: { main?: string; description?: string; icon?: string }
  isCurrent?: boolean
}

type WeatherChartProps = {
  data: ForecastDay[]
}

export default function WeatherChart({ data }: WeatherChartProps) {
  if (!data || data.length === 0) {
    return <div className="p-4">No chart data</div>
  }

  // Ensure chronological order (oldest -> newest), current expected to be last
  const sorted = data.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Adjust label format based on data length
  const isLongRange = sorted.length > 14
  const labels = sorted.map(f => {
    const date = new Date(f.date)
    if (isLongRange) {
      // For long ranges (30 days), show only date and month
      return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
    } else {
      // For shorter ranges, include day name
      return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    }
  })

  const tempsMax = sorted.map(f => Math.round((f.temperature?.max ?? f.temperature?.avg ?? 0) * 10) / 10)
  const tempsAvg = sorted.map(f => Math.round((f.temperature?.avg ?? 0) * 10) / 10)
  const tempsMin = sorted.map(f => Math.round((f.temperature?.min ?? f.temperature?.avg ?? 0) * 10) / 10)
  const humidity = sorted.map(f => Math.round(((f.humidity?.avg ?? 0)) * 10) / 10)
  const rain = sorted.map(f => Math.round((f.rain ?? 0) * 10) / 10)

  const lastIndex = labels.length - 1

  // point styling arrays (highlight last/current point)
  const pointRadiusFor = (base: number) => labels.map((_, i) => (i === lastIndex ? base + 3 : base))
  const pointBackgroundFor = (baseColor: string) => labels.map((_, i) => (i === lastIndex ? '#000' : baseColor))
  const pointBorderFor = (baseBorder: string) => labels.map((_, i) => (i === lastIndex ? '#000' : baseBorder))

  const chartData = {
    labels,
    datasets: [
      {
        type: 'line' as const,
        label: 'Max °C',
        data: tempsMax,
        borderColor: 'rgba(239,68,68,0.95)',
        backgroundColor: 'rgba(239,68,68,0.12)',
        tension: 0.25,
        pointRadius: pointRadiusFor(3),
        pointBackgroundColor: pointBackgroundFor('rgba(239,68,68,0.95)'),
        pointBorderColor: pointBorderFor('rgba(239,68,68,0.95)'),
        yAxisID: 'yTemp',
        fill: false
      },
      {
        type: 'line' as const,
        label: 'Avg °C',
        data: tempsAvg,
        borderColor: 'rgba(16,185,129,0.95)',
        backgroundColor: 'rgba(16,185,129,0.12)',
        tension: 0.25,
        pointRadius: pointRadiusFor(2.5),
        pointBackgroundColor: pointBackgroundFor('rgba(16,185,129,0.95)'),
        pointBorderColor: pointBorderFor('rgba(16,185,129,0.95)'),
        yAxisID: 'yTemp',
        fill: 'origin'
      },
      {
        type: 'line' as const,
        label: 'Min °C',
        data: tempsMin,
        borderColor: 'rgba(59,130,246,0.95)',
        backgroundColor: 'rgba(59,130,246,0.08)',
        tension: 0.25,
        pointRadius: pointRadiusFor(2),
        pointBackgroundColor: pointBackgroundFor('rgba(59,130,246,0.95)'),
        pointBorderColor: pointBorderFor('rgba(59,130,246,0.95)'),
        yAxisID: 'yTemp',
        fill: false
      },
      {
        type: 'line' as const,
        label: 'Humidity %',
        data: humidity,
        borderColor: 'rgba(250,204,21,0.95)',
        backgroundColor: 'rgba(250,204,21,0.12)',
        borderDash: [6, 4],
        tension: 0.2,
        pointRadius: pointRadiusFor(2.5),
        pointBackgroundColor: pointBackgroundFor('rgba(250,204,21,0.95)'),
        pointBorderColor: pointBorderFor('rgba(250,204,21,0.95)'),
        yAxisID: 'yHumidity',
        fill: false
      },
      {
        type: 'bar' as const,
        label: 'Rain (mm)',
        data: rain,
        backgroundColor: labels.map((_, i) => (i === lastIndex ? 'rgba(0,0,0,0.9)' : 'rgba(99,102,241,0.85)')),
        borderColor: labels.map((_, i) => (i === lastIndex ? '#000' : 'rgba(99,102,241,0.95)')),
        borderWidth: 1,
        yAxisID: 'yRain',
        order: 1
      }
    ]
  }

  const options: any = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        callbacks: {
          label: function (context: any) {
            const label = context.dataset.label || ''
            const value = context.formattedValue
            if (label.includes('°C')) return `${label}: ${value} °C`
            if (label.includes('Humidity')) return `${label}: ${value} %`
            if (label.includes('Rain')) return `${label}: ${value} mm`
            return `${label}: ${value}`
          }
        }
      },
      title: { display: false }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          maxRotation: isLongRange ? 45 : 0,
          minRotation: isLongRange ? 45 : 0,
          autoSkip: true,
          maxTicksLimit: isLongRange ? 15 : labels.length
        }
      },
      yTemp: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'Temperature (°C)' },
        ticks: { callback: (v: any) => `${v}°` },
        grid: { color: 'rgba(0,0,0,0.06)' }
      },
      yHumidity: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Humidity (%)' },
        ticks: { callback: (v: any) => `${v}%` },
        grid: { drawOnChartArea: false },
        // reduce clutter by offsetting slightly
        offset: true
      },
      yRain: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'Rain (mm)' },
        ticks: { callback: (v: any) => `${v}mm` },
        grid: { drawOnChartArea: false },
        offset: true
      }
    }
  }

  // small plugin to draw a vertical "Now" marker at the last index
  const currentMarker = {
    id: 'currentMarker',
    afterDatasetsDraw: (chart: any) => {
      const ctx = chart.ctx
      const xScale = chart.scales.x
      if (!xScale) return
      const pixel = xScale.getPixelForValue(lastIndex)
      if (!pixel || isNaN(pixel)) return
      ctx.save()
      // dashed vertical line
      ctx.strokeStyle = 'rgba(0,0,0,0.12)'
      ctx.lineWidth = 1
      ctx.setLineDash([4, 4])
      ctx.beginPath()
      ctx.moveTo(pixel, chart.chartArea.top)
      ctx.lineTo(pixel, chart.chartArea.bottom)
      ctx.stroke()
      ctx.setLineDash([])
      // label
      ctx.fillStyle = '#111'
      ctx.font = '12px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Now', pixel, chart.chartArea.top + 14)
      ctx.restore()
    }
  }

  return (
    <div style={{ height: isLongRange ? 450 : 380 }} className="bg-white border rounded-lg p-4">
      <Chart type="bar" options={options} data={chartData} plugins={[currentMarker]} />
    </div>
  )
}
