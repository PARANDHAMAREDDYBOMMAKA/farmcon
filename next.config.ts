import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Optimize for production
  poweredByHeader: false,
  compress: true,

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
  },

  // Output config for Vercel
  outputFileTracingIncludes: {
    '/api/**': ['./node_modules/**'],
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Ignore warnings from Prisma instrumentation and OpenTelemetry
      config.ignoreWarnings = [
        { module: /node_modules\/@prisma\/instrumentation/ },
        { module: /node_modules\/@opentelemetry\/instrumentation/ },
      ]
    }
    return config
  },
};

export default nextConfig;