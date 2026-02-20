'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '@/lib/logger';

/**
 * Global Error Page - Handles critical errors at the application root.
 * Renders its own <html> and <body> because the root layout may have failed.
 * Uses inline styles so it works even when global CSS is not loaded.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error('Global Error (Root Level)', {
      error,
      digest: error.digest,
      message: error.message,
      stack: error.stack,
      level: 'global',
    });

    if (typeof window !== 'undefined') {
      try {
        const sentry = (window as Window & { Sentry?: { captureException: (error: Error, options?: object) => void } }).Sentry;
        if (sentry?.captureException) {
          sentry.captureException(error, {
            level: 'fatal',
            tags: { errorType: 'global', errorPage: 'global-error' },
          });
        }
      } catch (sentryError) {
        logger.warn('Failed to send global error to Sentry', { error: sentryError });
      }
    }
  }, [error]);

  const handleReset = () => {
    try {
      reset();
    } catch (resetError) {
      logger.error('Error resetting global error', resetError as Error);
      if (typeof window !== 'undefined') window.location.reload();
    }
  };

  const handleGoHome = () => {
    if (typeof window !== 'undefined') window.location.href = '/';
  };

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    padding: '24px',
    textAlign: 'center',
    background: '#0a0a0f',
    color: '#ffffff',
    margin: 0,
  };

  const cardStyle: React.CSSProperties = {
    maxWidth: '480px',
    width: '100%',
    background: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '16px',
    padding: '40px 32px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)',
  };

  const digestStyle: React.CSSProperties = {
    marginBottom: '24px',
    padding: '12px',
    background: 'rgba(255, 255, 255, 0.06)',
    borderRadius: '8px',
    fontSize: '0.875rem',
    color: 'rgba(255, 255, 255, 0.7)',
  };

  const buttonPrimaryStyle: React.CSSProperties = {
    padding: '12px 24px',
    fontSize: '1rem',
    fontWeight: 600,
    backgroundColor: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    width: '100%',
    marginBottom: '12px',
  };

  const buttonSecondaryStyle: React.CSSProperties = {
    ...buttonPrimaryStyle,
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.9)',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  };

  const linkStyle: React.CSSProperties = {
    color: '#a78bfa',
    textDecoration: 'none',
    fontWeight: 500,
    marginTop: '24px',
    display: 'inline-block',
  };

  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0a0a0f', color: '#fff' }}>
        <div style={containerStyle}>
          <div style={cardStyle}>
            <div style={{
              width: '64px',
              height: '64px',
              margin: '0 auto 24px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <AlertTriangle style={{ width: 32, height: 32, color: '#f87171' }} aria-hidden />
            </div>

            <h1 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '12px', color: '#fff' }}>
              Critical error
            </h1>
            <p style={{ marginBottom: '24px', color: 'rgba(255, 255, 255, 0.6)', fontSize: '1rem', lineHeight: 1.5 }}>
              Something went wrong at the application level. Try again or return home.
            </p>

            {error.digest && (
              <div style={digestStyle}>
                <strong>Error code:</strong>{' '}
                <code style={{ background: 'rgba(0,0,0,0.2)', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' }}>
                  {error.digest}
                </code>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              <button type="button" onClick={handleReset} style={buttonPrimaryStyle}>
                <RefreshCw style={{ width: 20, height: 20 }} aria-hidden />
                Try again
              </button>
              <button type="button" onClick={handleGoHome} style={buttonSecondaryStyle}>
                <Home style={{ width: 20, height: 20 }} aria-hidden />
                Go home
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'rgba(255, 255, 255, 0.5)', marginTop: '24px' }}>
              If this continues,{' '}
              <a href="/help/support" style={linkStyle}>
                contact support
              </a>
            </p>

            {typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && (
              <details style={{
                marginTop: '24px',
                padding: '16px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.875rem',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 600, color: '#fca5a5' }}>
                  Error details (dev only)
                </summary>
                <pre style={{
                  margin: '12px 0 0',
                  padding: '12px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '200px',
                  fontSize: '0.75rem',
                  color: '#fca5a5',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                }}>
                  {error.message}
                  {'\n\n'}
                  {error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      </body>
    </html>
  );
}
