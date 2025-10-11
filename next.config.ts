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

  // Reduce serverless function size
  experimental: {
    serverMinification: true,
    serverSourceMaps: false,
  },

  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize heavy dependencies to reduce function size
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

// Wrap with PWA first, then Sentry
const configWithPWA = withPWA({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    {
      urlPattern: /^https?.*/,
      handler: "NetworkFirst",
      options: {
        cacheName: "offlineCache",
        expiration: {
          maxEntries: 200,
        },
      },
    },
  ],
})(nextConfig);

export default withSentryConfig(configWithPWA, {
  // Sentry configuration
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only print logs for uploading source maps in CI
  silent: !process.env.CI,

  // Upload source maps to Sentry - disabled to reduce bundle size
  hideSourceMaps: true,
  disableLogger: true,

  // Automatically annotate React components to show their full name in breadcrumbs and session replay
  reactComponentAnnotation: {
    enabled: false, // Disabled to reduce bundle size
  },

  // Disable autoInstrumentation to reduce bundle size
  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
});