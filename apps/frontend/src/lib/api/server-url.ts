/**
 * Server-side API URL helper for Next.js API routes.
 *
 * MUST be used instead of inline `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'`
 * in all server-side API routes.
 *
 * - Use NEXT_PUBLIC_API_URL when set (e.g. in production)
 * - In development: falls back to http://localhost:3001
 */
export function getBackendUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
}
