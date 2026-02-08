'use client';

import React, { useEffect } from 'react';
import { logger } from '@/lib/logger';

/**
 * Global Error Page - Gère les erreurs critiques au niveau de l'application
 * 
 * Cette page est affichée lorsqu'une erreur non récupérable se produit
 * au niveau du layout racine de l'application Next.js
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

    // Envoyer à Sentry si disponible
    if (typeof window !== 'undefined') {
      try {
        const sentry = (window as Window & { Sentry?: { captureException: (error: Error, options?: object) => void } }).Sentry;
        if (sentry && sentry.captureException) {
          sentry.captureException(error, {
            level: 'fatal',
            tags: {
              errorType: 'global',
              errorPage: 'global-error',
            },
          });
        }
      } catch (sentryError) {
        logger.warn('Failed to send global error to Sentry', sentryError as Error);
      }
    }
  }, [error]);

  const handleReset = () => {
    try {
      reset();
    } catch (resetError) {
      logger.error('Error resetting global error', resetError as Error);
      // Fallback: reload page
      window.location.reload();
    }
  };

  const handleGoHome = () => {
    window.location.href = '/';
  };

  return (
    <html>
      <body style={{ margin: 0, padding: 0 }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          padding: '20px',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
        }}>
          <div style={{
            maxWidth: '600px',
            width: '100%',
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '48px 32px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 24px',
              background: '#fee2e2',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
            }}>
              ⚠️
            </div>

            <h1 style={{
              fontSize: '2rem',
              fontWeight: 'bold',
              marginBottom: '16px',
              color: '#111827',
            }}>
              Erreur Critique
            </h1>

            <p style={{
              marginBottom: '32px',
              color: '#6b7280',
              fontSize: '1rem',
              lineHeight: '1.5',
            }}>
              Une erreur critique est survenue au niveau de l'application.
              Notre équipe technique a été automatiquement notifiée et travaille à résoudre le problème.
            </p>

            {error.digest && (
              <div style={{
                marginBottom: '24px',
                padding: '12px',
                background: '#f3f4f6',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#374151',
              }}>
                <strong>Code d'erreur:</strong>{' '}
                <code style={{
                  background: '#e5e7eb',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontFamily: 'monospace',
                }}>
                  {error.digest}
                </code>
              </div>
            )}

            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              marginBottom: '32px',
            }}>
              <button
                onClick={handleReset}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  backgroundColor: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.2s',
                }}
                onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                ⟳ Réessayer
              </button>

              <button
                onClick={handleGoHome}
                style={{
                  padding: '12px 24px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  backgroundColor: '#fff',
                  color: '#374151',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'border-color 0.2s',
                }}
                onMouseOver={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.borderColor = '#d1d5db'}
                onMouseOut={(e: React.MouseEvent<HTMLButtonElement>) => e.currentTarget.style.borderColor = '#e5e7eb'}
              >
                🏠 Retour à l'accueil
              </button>
            </div>

            <p style={{
              fontSize: '0.875rem',
              color: '#6b7280',
              marginTop: '24px',
            }}>
              Si le problème persiste,{' '}
              <a
                href="/help/support"
                style={{
                  color: '#3b82f6',
                  textDecoration: 'none',
                  fontWeight: '500',
                }}
                onMouseOver={(e: React.MouseEvent<HTMLAnchorElement>) => e.currentTarget.style.textDecoration = 'underline'}
              >
                contactez notre support
              </a>
            </p>

            {typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && (
              <details style={{
                marginTop: '32px',
                padding: '16px',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                textAlign: 'left',
                fontSize: '0.875rem',
              }}>
                <summary style={{
                  cursor: 'pointer',
                  fontWeight: '600',
                  color: '#991b1b',
                  marginBottom: '12px',
                }}>
                  Détails de l'erreur (dev only)
                </summary>
                <pre style={{
                  margin: 0,
                  padding: '12px',
                  background: '#fff',
                  borderRadius: '4px',
                  overflow: 'auto',
                  maxHeight: '300px',
                  fontSize: '0.75rem',
                  color: '#991b1b',
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


