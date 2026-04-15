'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Home, RefreshCcw, Sprout } from 'lucide-react'
import * as Sentry from '@sentry/nextjs'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-rose-50 via-white to-emerald-50 flex items-center justify-center px-6">
      <div className="absolute -top-32 -right-32 w-120 h-120 bg-rose-200/30 rounded-full blur-3xl fc-blob" />
      <div
        className="absolute -bottom-32 -left-32 w-120 h-120 bg-emerald-200/30 rounded-full blur-3xl fc-blob"
        style={{ animationDelay: '3s' }}
      />

      <div className="relative max-w-xl w-full text-center space-y-8">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-extrabold text-emerald-950">FarmCon</span>
        </Link>

        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-24 rounded-3xl bg-linear-to-br from-rose-500 to-rose-600 flex items-center justify-center shadow-2xl shadow-rose-500/30">
              <AlertTriangle className="w-12 h-12 text-white" />
            </div>
            <span className="absolute inset-0 rounded-3xl bg-rose-400/40 blur-2xl" />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-rose-600">
            Something went wrong
          </p>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-emerald-950 tracking-tight">
            A gust knocked over the haystack.
          </h1>
          <p className="text-base text-slate-600 max-w-md mx-auto">
            An unexpected error happened while rendering this page. Our team has been notified.
            You can try reloading, or head back home.
          </p>

          {error?.digest && (
            <p className="inline-block mt-2 text-xs font-mono text-slate-500 bg-slate-100 ring-1 ring-slate-200 rounded-full px-3 py-1">
              Error ID · {error.digest}
            </p>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-linear-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
          >
            <RefreshCcw className="w-4 h-4" />
            Try again
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white ring-2 ring-emerald-200 text-emerald-800 font-bold hover:ring-emerald-400 hover:bg-emerald-50 transition-all"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
