import type { MetadataRoute } from 'next'

const STATIC_ROUTES = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' as const },
  { path: '/auth/signup', priority: 0.8, changeFrequency: 'monthly' as const },
  { path: '/auth/signin', priority: 0.7, changeFrequency: 'monthly' as const },
  { path: '/api-docs', priority: 0.4, changeFrequency: 'monthly' as const },
  { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/terms-of-service', priority: 0.3, changeFrequency: 'yearly' as const },
  { path: '/cookie-policy', priority: 0.3, changeFrequency: 'yearly' as const },
]

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://farmcon.in'
  const now = new Date()

  return STATIC_ROUTES.map((r) => ({
    url: `${baseUrl}${r.path}`,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }))
}
