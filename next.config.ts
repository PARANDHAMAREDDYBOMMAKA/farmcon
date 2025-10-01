import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
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