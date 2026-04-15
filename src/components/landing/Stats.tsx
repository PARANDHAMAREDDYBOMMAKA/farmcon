import { Container } from '@/components/ui/container'

const stats = [
  { value: '10K+', label: 'Active farmers' },
  { value: '₹500 Cr', label: 'Crops sold' },
  { value: '40%', label: 'Avg. yield lift' },
  { value: '24/7', label: 'Expert support' },
]

export function Stats() {
  return (
    <section className="relative py-16 -mt-4">
      <Container>
        <div className="relative rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 shadow-2xl shadow-emerald-900/30">
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.6) 1px, transparent 0)',
              backgroundSize: '44px 44px',
            }}
          />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-amber-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-teal-300/20 rounded-full blur-3xl" />

          <div className="relative grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-10 p-10 lg:p-14">
            {stats.map((s, i) => (
              <div
                key={s.label}
                className={`text-center md:text-left md:border-l md:border-white/15 md:pl-6 ${i === 0 ? 'md:border-l-0 md:pl-0' : ''}`}
              >
                <p className="text-5xl lg:text-6xl font-extrabold text-white tracking-tight">
                  {s.value}
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-emerald-100">
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  )
}
