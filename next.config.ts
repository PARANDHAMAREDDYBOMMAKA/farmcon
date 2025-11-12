import { withSentryConfig } from "@sentry/nextjs";
import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  poweredByHeader: false,
  compress: true,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    minimumCacheTTL: 60,
  },

  experimental: {
    serverMinification: true,
    serverSourceMaps: false,
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      
      config.externals = [
        ...config.externals,
        'engine.io-client',
        'axe-core',
        '@babel/generator',
        'lodash',
        'core-js',
      ]
    }
    return config
  },
};

const configWithPWA = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "google-fonts",
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp|avif)$/i,
      handler: "CacheFirst",
      options: {
        cacheName: "static-images",
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\/_next\/static\/.*/i,
      handler: "CacheFirst",
      options: {
        cacheName: "next-static",
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 365 * 24 * 60 * 60, // 1 year
        },
      },
    },
    {
      urlPattern: /\/api\/weather\/.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "api-weather",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 10 * 60, // 10 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\/api\/market-prices.*/i,
      handler: "StaleWhileRevalidate",
      options: {
        cacheName: "api-market-prices",
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60, // 1 hour
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /\/api\/products.*/i,
      handler: "NetworkFirst",
      options: {
        cacheName: "api-products",
        networkTimeoutSeconds: 5,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60, // 5 minutes
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 24 * 60 * 60, // 1 day
        },
      },
    },
  ],
})(nextConfig);

export default withSentryConfig(configWithPWA, {

  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  silent: !process.env.CI,

  sourcemaps: {
    disable: true,
  },
  disableLogger: true,

  reactComponentAnnotation: {
    enabled: false,
  },

  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
});