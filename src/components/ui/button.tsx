import * as React from 'react'
import Link from 'next/link'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'accent'
type Size = 'sm' | 'md' | 'lg' | 'xl' | 'icon'

const base =
  'inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap select-none'

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/35 hover:-translate-y-0.5 active:translate-y-0',
  secondary:
    'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200',
  outline:
    'bg-white text-emerald-800 border-2 border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50',
  ghost: 'bg-transparent text-emerald-800 hover:bg-emerald-50',
  destructive:
    'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-xl hover:shadow-rose-500/35',
  accent:
    'bg-gradient-to-br from-amber-400 to-amber-500 text-amber-950 shadow-lg shadow-amber-400/30 hover:shadow-xl hover:shadow-amber-400/40',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-4 text-sm',
  md: 'h-11 px-5 text-sm',
  lg: 'h-12 px-6 text-base',
  xl: 'h-14 px-8 text-base',
  icon: 'h-10 w-10',
}

type CommonProps = {
  variant?: Variant
  size?: Size
  className?: string
  children?: React.ReactNode
}

type ButtonProps = CommonProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    href?: undefined
  }

type LinkButtonProps = CommonProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string
    external?: boolean
  }

export type UIButtonProps = ButtonProps | LinkButtonProps

export const Button = React.forwardRef<HTMLElement, UIButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, children, ...rest },
  ref,
) {
  const classes = cn(base, variants[variant], sizes[size], className)

  if ('href' in rest && rest.href) {
    const { href, external, ...anchorRest } = rest as LinkButtonProps
    if (external || /^https?:/.test(href)) {
      return (
        <a
          ref={ref as React.Ref<HTMLAnchorElement>}
          href={href}
          className={classes}
          target="_blank"
          rel="noopener noreferrer"
          {...anchorRest}
        >
          {children}
        </a>
      )
    }
    return (
      <Link ref={ref as React.Ref<HTMLAnchorElement>} href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    )
  }

  return (
    <button ref={ref as React.Ref<HTMLButtonElement>} className={classes} {...(rest as ButtonProps)}>
      {children}
    </button>
  )
})
