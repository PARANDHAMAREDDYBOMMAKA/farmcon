import * as React from 'react'
import { cn } from '@/lib/cn'

const fieldBase =
  'w-full rounded-xl border-2 border-emerald-100 bg-white px-4 py-3 text-[15px] text-emerald-950 placeholder:text-slate-400 transition-all focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:opacity-60 disabled:cursor-not-allowed'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(fieldBase, className)} {...props} />
  },
)

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(fieldBase, 'min-h-[96px] resize-y', className)} {...props} />
})

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select
      ref={ref}
      className={cn(fieldBase, 'appearance-none pr-10 bg-no-repeat bg-[right_14px_center]', className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8' fill='none'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
      }}
      {...props}
    >
      {children}
    </select>
  )
})

export function Label({
  className,
  children,
  required,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label
      className={cn(
        'block text-sm font-semibold text-emerald-900 mb-1.5 flex items-center gap-1.5',
        className,
      )}
      {...props}
    >
      {children}
      {required && <span className="text-rose-500">*</span>}
    </label>
  )
}

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p className="mt-1.5 text-xs font-medium text-rose-600">{children}</p>
}

export function FieldHint({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p className="mt-1.5 text-xs text-slate-500">{children}</p>
}
