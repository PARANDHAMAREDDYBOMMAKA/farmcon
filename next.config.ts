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
  
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  silent: !process.env.CI,

  hideSourceMaps: true,
  disableLogger: true,

  reactComponentAnnotation: {
    enabled: false, 
  },

  autoInstrumentServerFunctions: false,
  autoInstrumentMiddleware: false,
});