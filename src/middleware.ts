import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const pathname = request.nextUrl.pathname

  // Cache static assets aggressively
  if (
    pathname.startsWith('/_next/static/') ||
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|webp|woff|woff2|ttf|eot|css|js)$/)
  ) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    )
    return response
  }

  // Cache API routes with stale-while-revalidate
  if (pathname.startsWith('/api/products')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    )
  }

  if (pathname.startsWith('/api/market-prices')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=1800'
    )
  }

  if (pathname.startsWith('/api/categories')) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=86400, stale-while-revalidate=43200'
    )
  }

  // Set security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')

  return response
}

export const config = {
  matcher: [
    // '/((?!_next/image|favicon.ico).*)',
    '/api/:path*',
  ],
}
