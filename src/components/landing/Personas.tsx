import Link from 'next/link'
import { Tractor, ShoppingBag, Warehouse, Shield, ArrowRight } from 'lucide-react'
import { Container, SectionHeading } from '@/components/ui/container'

const personas = [
  {
    icon: Tractor,
    title: 'Farmers',
    tagline: 'Grow better crops, sell at better prices.',
    bullets: ['Crop lifecycle tracking', 'AI disease detection', 'Direct buyer access'],
    href: '/auth/signup?role=farmer',
    bg: 'from-emerald-500 to-teal-600',
  },
  {
    icon: ShoppingBag,
    title: 'Buyers',
    tagline: 'Fresh produce delivered from verified farms.',
    bullets: ['Browse mandis live', 'Track deliveries in real-time', 'Bulk procurement'],
    href: '/auth/signup?role=consumer',
    bg: 'from-amber-400 to-orange-500',
  },
  {
    icon: Warehouse,
    title: 'Suppliers',
    tagline: 'Reach 10,000+ active farmers nationwide.',
    bullets: ['Inventory & order manager', 'Verified listings', 'Direct reach to farmers'],
    href: '/auth/signup?role=supplier',
    bg: 'from-sky-500 to-blue-600',
  },
  {
    icon: Shield,
    title: 'Admins',
    tagline: 'Run the network with full visibility.',
    bullets: ['GMV & user dashboards', 'Moderation & disputes', 'Automated backups'],
    href: '/auth/signup?role=admin',
    bg: 'from-purple-500 to-indigo-600',
  },
]

export function Personas() {
  return (
    <section id="who" className="py-24 lg:py-32">
      <Container>
        <SectionHeading
          eyebrow="Built for everyone in the chain"
          title={
            <>
              A dashboard for{' '}
              <span className="bg-gradient-to-r from-emerald-500 to-teal-600 bg-clip-text text-transparent">
                every role.
              </span>
            </>
          }
          subtitle="Four tailored experiences under one roof. No apps to juggle."
        />

        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {personas.map((p) => {
            const Icon = p.icon
            return (
              <Link
                key={p.title}
                href={p.href}
                className="group relative overflow-hidden rounded-2xl bg-white ring-1 ring-emerald-100 hover:ring-emerald-300 shadow-sm hover:shadow-2xl transition-all duration-300 p-6 flex flex-col"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${p.bg} flex items-center justify-center shadow-lg mb-5`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-extrabold text-emerald-950">{p.title}</h3>
                <p className="text-sm font-medium text-emerald-700 mt-1">{p.tagline}</p>

                <ul className="mt-5 space-y-2 flex-1">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-700">
                      <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-emerald-500" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-emerald-700">
                  Open {p.title.toLowerCase()} dashboard
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>

                <div className={`absolute -bottom-20 -right-20 w-48 h-48 rounded-full bg-gradient-to-br ${p.bg} opacity-0 group-hover:opacity-10 blur-3xl transition-opacity`} />
              </Link>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
