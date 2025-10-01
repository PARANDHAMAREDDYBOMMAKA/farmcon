// This file configures the initialization of Sentry on the client.
// Disabled for now to prevent initialization issues with SSR

// import * as Sentry from "@sentry/nextjs";

// Client-side Sentry disabled
// Sentry.init({
//   dsn: "https://20ab01097fa7e36834cc23c1a149589c@o4508181436497920.ingest.us.sentry.io/4510112343654400",
//   tracesSampleRate: 1,
//   replaysOnErrorSampleRate: 1.0,
//   replaysSessionSampleRate: 0.1,
//   integrations: [
//     Sentry.replayIntegration({
//       maskAllText: true,
//       blockAllMedia: true,
//     }),
//   ],
//   enableLogs: true,
//   debug: false,
//   beforeSend(event, hint) {
//     if (process.env.NODE_ENV === 'development') {
//       console.log('Sentry event (dev mode):', event)
//       return null
//     }
//     return event
//   },
// });
