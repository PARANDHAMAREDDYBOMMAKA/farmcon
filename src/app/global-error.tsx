'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #ecfdf5 0%, #ffffff 50%, #f0fdfa 100%)',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
          padding: '24px',
          color: '#0f172a',
        }}
      >
        <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: '0 auto 20px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, #ef4444, #e11d48)',
              boxShadow: '0 12px 30px rgba(239,68,68,0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            !
          </div>
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#e11d48',
            }}
          >
            Something went wrong
          </p>
          <h1
            style={{
              margin: '10px 0 12px',
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: '-0.5px',
              color: '#064e3b',
            }}
          >
            The whole orchard tripped.
          </h1>
          <p style={{ margin: 0, color: '#475569', fontSize: 16, lineHeight: 1.6 }}>
            A critical error occurred and the app couldn’t recover. Our team has been notified.
            Please reload to try again.
          </p>
          {error?.digest && (
            <p
              style={{
                display: 'inline-block',
                marginTop: 18,
                padding: '4px 12px',
                fontSize: 12,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                color: '#475569',
                background: '#f1f5f9',
                borderRadius: 999,
                border: '1px solid #e2e8f0',
              }}
            >
              Error ID · {error.digest}
            </p>
          )}
          <div
            style={{
              marginTop: 28,
              display: 'flex',
              gap: 12,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              onClick={() => reset()}
              style={{
                height: 48,
                padding: '0 24px',
                borderRadius: 12,
                background: 'linear-gradient(135deg, #10b981, #0d9488)',
                color: '#ffffff',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 10px 24px rgba(16,185,129,0.3)',
              }}
            >
              Reload app
            </button>
            <a
              href="/"
              style={{
                height: 48,
                padding: '0 24px',
                borderRadius: 12,
                background: '#ffffff',
                color: '#065f46',
                fontWeight: 700,
                border: '2px solid #a7f3d0',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              Back to home
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
