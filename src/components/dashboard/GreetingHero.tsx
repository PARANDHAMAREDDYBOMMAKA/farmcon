import { Sunrise, Sun, Sunset, Moon } from 'lucide-react'
import { cn } from '@/lib/cn'

type Persona = 'farmer' | 'consumer' | 'supplier' | 'admin'

const greetings = {
  night: { label: 'Good night', icon: Moon, gradient: 'from-indigo-600 via-purple-700 to-slate-900' },
  morning: { label: 'Good morning', icon: Sunrise, gradient: 'from-amber-400 via-orange-400 to-rose-400' },
  afternoon: { label: 'Good afternoon', icon: Sun, gradient: 'from-emerald-500 via-teal-500 to-sky-500' },
  evening: { label: 'Good evening', icon: Sunset, gradient: 'from-orange-500 via-pink-500 to-violet-600' },
}

const personaTagline: Record<Persona, string> = {
  farmer: 'Here’s your farm at a glance — track crops, orders, and weather.',
  consumer: 'Fresh picks and order updates from verified farmers near you.',
  supplier: 'Your marketplace performance, inventory, and orders in one view.',
  admin: 'Platform health, growth metrics, and operations — all in focus.',
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 5) return greetings.night
  if (h < 12) return greetings.morning
  if (h < 17) return greetings.afternoon
  if (h < 21) return greetings.evening
  return greetings.night
}

export function GreetingHero({
  name,
  role,
  rightSlot,
}: {
  name: string
  role: Persona
  rightSlot?: React.ReactNode
}) {
  const g = getGreeting()
  const Icon = g.icon
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 md:p-8 text-white shadow-xl',
        `bg-gradient-to-br ${g.gradient}`,
      )}
    >
      <div className="absolute -top-16 -right-16 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 bg-white/10 rounded-full blur-2xl" />

      <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Icon className="w-7 h-7" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {g.label}, {name}
            </h1>
          </div>
          <p className="text-sm md:text-base text-white/90 max-w-xl">{personaTagline[role]}</p>
        </div>
        {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      </div>
    </div>
  )
}
