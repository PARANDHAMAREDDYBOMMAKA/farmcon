import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: 0.1, // Reduced from default to minimize overhead

  // Session replay - disabled to prevent multiple instance errors
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Minimize bundle size
  integrations: [
    Sentry.browserTracingIntegration(),
  ],

  // Environment
  environment: process.env.NODE_ENV,

  // Ignore common errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'Non-Error promise rejection captured',
  ],
});
