export type WeatherSnapshot = {
  location: string
  temperature: number
  condition: string
  humidity: number
  windSpeed: number
  rainfall: number
  forecast: { date: string; high: number; low: number; condition: string }[]
  source: string
}

export type GeoPoint = { lat: number; lon: number; name?: string }

const WMO_LABEL = (code: number, rain = 0): string => {
  if (rain > 5) return 'Rainy'
  if (rain > 0) return 'Light Rain'
  if (code === 0) return 'Clear Sky'
  if (code <= 3) return 'Partly Cloudy'
  if (code <= 48) return 'Foggy'
  if (code <= 67) return 'Rainy'
  if (code <= 77) return 'Snowy'
  if (code <= 99) return 'Thunderstorm'
  return 'Clear'
}

function formatDay(dateStr: string, offset: number) {
  if (offset === 0) return 'Today'
  if (offset === 1) return 'Tomorrow'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { weekday: 'short' })
}

async function safeJson(url: string, options?: RequestInit) {
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        'User-Agent': 'FarmCon-Weather-App',
        ...(options?.headers || {}),
      },
      next: { revalidate: 300 },
    })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function geocodeNominatim(location: string): Promise<GeoPoint | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`
  const data = await safeJson(url)
  if (!Array.isArray(data) || !data[0]) return null
  const name = data[0].display_name?.split(',')[0] || data[0].name || location
  return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), name }
}

export async function getWeather(location: string): Promise<WeatherSnapshot | null> {
  const geo = (await geocodeNominatim(location)) || {
    lat: 28.6139,
    lon: 77.209,
    name: location,
  }
  const displayName = geo.name || location

  const params = new URLSearchParams({
    latitude: String(geo.lat),
    longitude: String(geo.lon),
    current:
      'temperature_2m,relative_humidity_2m,precipitation,rain,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum',
    timezone: 'auto',
    forecast_days: '7',
  })
  const data = await safeJson(
    `https://api.open-meteo.com/v1/forecast?${params.toString()}`,
  )
  if (!data?.current || !data?.daily) return null

  const c = data.current
  const d = data.daily
  const rain = c.precipitation || c.rain || 0

  return {
    location: displayName,
    temperature: Math.round(c.temperature_2m ?? 0),
    condition: WMO_LABEL(c.weather_code ?? 0, rain),
    humidity: Math.round(c.relative_humidity_2m ?? 0),
    windSpeed: Math.round(c.wind_speed_10m ?? 0),
    rainfall: Math.round((rain ?? 0) * 10) / 10,
    forecast: (d.time || []).slice(0, 7).map((date: string, i: number) => ({
      date: formatDay(date, i),
      high: Math.round(d.temperature_2m_max?.[i] ?? 0),
      low: Math.round(d.temperature_2m_min?.[i] ?? 0),
      condition: WMO_LABEL(d.weather_code?.[i] ?? 0, d.precipitation_sum?.[i] ?? 0),
    })),
    source: 'Open-Meteo',
  }
}
