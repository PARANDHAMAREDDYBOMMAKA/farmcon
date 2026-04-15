import Link from 'next/link'
import { CloudSun, Droplets, Wind, ArrowUpRight } from 'lucide-react'

export type WeatherCardData = {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  forecast: { day: string; high: number; low: number; condition: string }[]
}

export function WeatherCard({ data }: { data: WeatherCardData }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sky-500 via-sky-600 to-blue-700 shadow-lg shadow-sky-900/20 text-white p-6">
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-cyan-300/20 rounded-full blur-3xl" />

      <div className="relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <CloudSun className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">Weather forecast</h3>
              <p className="text-xs text-sky-100/90">{data.location}</p>
            </div>
          </div>
          <Link
            href="/dashboard/weather"
            className="inline-flex items-center gap-1 text-xs font-bold rounded-full bg-white/20 hover:bg-white/30 px-3 py-1.5 transition-colors"
          >
            Details
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          <div className="bg-white/15 backdrop-blur-md ring-1 ring-white/20 rounded-2xl p-5">
            <p className="text-5xl font-extrabold tracking-tight">{data.temperature}°</p>
            <p className="text-sm font-semibold mt-1">{data.condition}</p>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="bg-white/15 rounded-xl p-2.5 ring-1 ring-white/15">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-100/80">
                  <Droplets className="w-3 h-3" />
                  Humidity
                </p>
                <p className="text-base font-bold mt-0.5">{data.humidity}%</p>
              </div>
              <div className="bg-white/15 rounded-xl p-2.5 ring-1 ring-white/15">
                <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-100/80">
                  <Wind className="w-3 h-3" />
                  Wind
                </p>
                <p className="text-base font-bold mt-0.5">{data.windSpeed} km/h</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-sky-100/80 mb-3">
              3-day outlook
            </p>
            <div className="grid grid-cols-3 gap-3">
              {data.forecast.slice(0, 3).map((d, i) => (
                <div
                  key={i}
                  className="bg-white/15 backdrop-blur-md ring-1 ring-white/20 rounded-2xl p-4 hover:bg-white/20 transition-colors"
                >
                  <p className="text-sm font-bold">{d.day}</p>
                  <p className="text-xs text-sky-100/80 mt-0.5">{d.condition}</p>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold">{d.high}°</span>
                    <span className="text-sm text-sky-100/70">{d.low}°</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
