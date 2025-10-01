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

    // Optimize bundle size
    config.optimization = {
      ...config.optimization,
      moduleIds: 'deterministic',
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    }

    return config
  },
};

export default nextConfig;