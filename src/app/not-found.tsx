'use client'

import Link from 'next/link'
import { Home, Sprout, Search, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-teal-50 flex items-center justify-center px-6">
      <div className="absolute -top-32 -right-32 w-[30rem] h-[30rem] bg-emerald-300/20 rounded-full blur-3xl fc-blob" />
      <div
        className="absolute -bottom-32 -left-32 w-[30rem] h-[30rem] bg-teal-300/20 rounded-full blur-3xl fc-blob"
        style={{ animationDelay: '3s' }}
      />

      <div className="relative max-w-xl w-full text-center space-y-8">
        <Link href="/" className="inline-flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-xl shadow-emerald-500/30 group-hover:scale-105 transition-transform">
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-extrabold text-emerald-950">FarmCon</span>
        </Link>

        <div className="space-y-3">
          <div className="text-[140px] leading-none font-extrabold tracking-tighter bg-gradient-to-br from-emerald-500 via-teal-500 to-emerald-700 bg-clip-text text-transparent">
            404
          </div>
          <h1 className="text-3xl lg:text-4xl font-extrabold text-emerald-950 tracking-tight">
            This field’s been ploughed but unplanted.
          </h1>
          <p className="text-base text-slate-600 max-w-md mx-auto">
            The page you’re looking for doesn’t exist, or the link has moved.
            Let’s get you back to fertile ground.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 transition-all"
          >
            <Home className="w-4 h-4" />
            Back to home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl bg-white ring-2 ring-emerald-200 text-emerald-800 font-bold hover:ring-emerald-400 hover:bg-emerald-50 transition-all"
          >
            <Search className="w-4 h-4" />
            Go to dashboard
          </Link>
        </div>

        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700 hover:text-emerald-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Go back
        </button>
      </div>
    </div>
  )
}
