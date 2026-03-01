import { logger } from '@/lib/logger';

/**
 * Server-side backend URL helper for Next.js API proxy routes.
 *
 * Uses BACKEND_INTERNAL_URL (server-only, for backend-to-backend calls) first,
 * then falls back to NEXT_PUBLIC_API_URL only if it differs from the frontend
 * origin (to avoid recursive loops when NEXT_PUBLIC_API_URL points to the
 * Next.js server itself).
 */
export function getBackendUrl(): string {
  const internal = process.env.BACKEND_INTERNAL_URL;
  if (internal) return internal;

  const publicUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!publicUrl && process.env.NODE_ENV === 'production') {
    logger.error('[CRITICAL] Neither BACKEND_INTERNAL_URL nor NEXT_PUBLIC_API_URL is set in production');
    return 'https://api.luneo.app';
  }

  if (publicUrl) {
    // In production/serverless environments, always respect the explicit public API URL.
    if (process.env.NODE_ENV === 'production') {
      try {
        const parsed = new URL(publicUrl);
        // Guard against accidental frontend URL configuration that creates proxy loops.
        if (parsed.hostname === 'luneo.app' || parsed.hostname === 'www.luneo.app') {
          logger.error('[CRITICAL] NEXT_PUBLIC_API_URL points to frontend host in production; forcing api.luneo.app');
          return 'https://api.luneo.app';
        }
      } catch {
        logger.error('[CRITICAL] NEXT_PUBLIC_API_URL is invalid in production; forcing api.luneo.app');
        return 'https://api.luneo.app';
      }
      return publicUrl;
    }

    try {
      const parsed = new URL(publicUrl);
      const isLocalFrontend =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1';
      if (isLocalFrontend) {
        return 'http://127.0.0.1:3001';
      }
    } catch {
      // Invalid URL, fallback below.
    }
    return publicUrl;
  }

  return 'http://127.0.0.1:3001';
}
