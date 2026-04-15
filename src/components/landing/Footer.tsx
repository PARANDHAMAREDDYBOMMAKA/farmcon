import Link from 'next/link'
import { Sprout, Phone, Mail, MapPin, Heart } from 'lucide-react'
import { Container } from '@/components/ui/container'

const FacebookIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.5-1.5H16.5V5c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H7.5v3h2.5v7h3.5z" />
  </svg>
)
const TwitterIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231L18.244 2.25Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
  </svg>
)
const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
)
const YoutubeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
    <path d="M23 7.3c-.2-1.3-1.2-2.4-2.5-2.6C18.2 4.3 12 4.3 12 4.3s-6.2 0-8.5.4C2.2 4.9 1.2 6 1 7.3.6 9.7.6 12 .6 12s0 2.3.4 4.7c.2 1.3 1.2 2.3 2.5 2.6 2.3.4 8.5.4 8.5.4s6.2 0 8.5-.4c1.3-.2 2.3-1.3 2.5-2.6.4-2.4.4-4.7.4-4.7s0-2.3-.4-4.7ZM10 15.5V8.5l5.5 3.5L10 15.5Z" />
  </svg>
)

const footerLinks = [
  {
    title: 'Product',
    links: [
      { name: 'Features', href: '#features' },
      { name: 'Pricing', href: '#pricing' },
      { name: 'API docs', href: '/api-docs' },
      { name: 'Roadmap', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { name: 'About', href: '#' },
      { name: 'Careers', href: '#' },
      { name: 'Blog', href: '#' },
      { name: 'Press', href: '#' },
    ],
  },
  {
    title: 'Support',
    links: [
      { name: 'Help center', href: '#' },
      { name: 'Contact', href: 'mailto:support@farmcon.in' },
      { name: 'WhatsApp', href: '#' },
      { name: 'Training', href: '#' },
    ],
  },
]

const socials = [
  { icon: FacebookIcon, href: '#', label: 'Facebook' },
  { icon: TwitterIcon, href: '#', label: 'Twitter' },
  { icon: InstagramIcon, href: '#', label: 'Instagram' },
  { icon: YoutubeIcon, href: '#', label: 'YouTube' },
]

export function Footer() {
  return (
    <footer className="relative bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-emerald-100 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6z' fill='%2334d399'/%3E%3C/svg%3E\")",
        }}
      />

      <Container className="relative py-20">
        <div className="grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xl font-extrabold text-white">FarmCon</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-emerald-300">Smart Agri OS</p>
              </div>
            </div>
            <p className="text-emerald-100/80 max-w-md leading-relaxed">
              Empowering Indian farmers with cutting-edge technology to maximize yields,
              profits, and pride of work.
            </p>

            <div className="space-y-2.5 text-sm">
              <a href="tel:+911800" className="flex items-center gap-3 text-emerald-100 hover:text-white transition-colors">
                <Phone className="w-4 h-4 text-emerald-400" />
                <span>+91 1800-XXX-XXXX</span>
              </a>
              <a href="mailto:support@farmcon.in" className="flex items-center gap-3 text-emerald-100 hover:text-white transition-colors">
                <Mail className="w-4 h-4 text-emerald-400" />
                <span>support@farmcon.in</span>
              </a>
              <div className="flex items-center gap-3 text-emerald-100">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Bangalore, Karnataka, India</span>
              </div>
            </div>

            <div className="flex gap-2.5 pt-2">
              {socials.map(({ icon: Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-xl bg-white/5 hover:bg-gradient-to-br hover:from-emerald-500 hover:to-teal-600 flex items-center justify-center ring-1 ring-white/10 transition-all hover:scale-110"
                >
                  <Icon className="w-4 h-4 text-emerald-100" />
                </Link>
              ))}
            </div>
          </div>

          {footerLinks.map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-bold uppercase tracking-[0.14em] text-white mb-5">
                {section.title}
              </h4>
              <ul className="space-y-3">
                {section.links.map((l) => (
                  <li key={l.name}>
                    <Link href={l.href} className="text-sm text-emerald-100/80 hover:text-emerald-300 transition-colors">
                      {l.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-emerald-200/70 flex items-center gap-1.5">
            © {new Date().getFullYear()} FarmCon. Built with <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400" /> for Indian farmers.
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <Link href="/privacy-policy" className="text-emerald-200/70 hover:text-emerald-300 transition-colors">Privacy</Link>
            <Link href="/terms-of-service" className="text-emerald-200/70 hover:text-emerald-300 transition-colors">Terms</Link>
            <Link href="/cookie-policy" className="text-emerald-200/70 hover:text-emerald-300 transition-colors">Cookies</Link>
          </div>
        </div>
      </Container>
    </footer>
  )
}
