/**
 * CSRF PROTECTION
 * Protection Cross-Site Request Forgery pour formulaires critiques
 */

import crypto from 'crypto';
import { cookies } from 'next/headers';
import { logger } from './logger';

const CSRF_TOKEN_NAME = 'csrf_token';
function getCsrfSecret(): string {
  const secret = process.env.CSRF_SECRET || process.env.SESSION_SECRET;
  if (!secret && process.env.NODE_ENV === 'production' && typeof window === 'undefined') {
    logger.warn('CSRF_SECRET or SESSION_SECRET not set in production — using fallback');
  }
  return secret || 'dev-csrf-secret-not-for-production';
}

/**
 * Générer un token CSRF
 */
export async function generateCSRFToken(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(CSRF_TOKEN_NAME)?.value;

  // Reuse current token to avoid rotating on every mutation request.
  if (existing) {
    return existing;
  }

  const token = crypto.randomBytes(32).toString('hex');

  // Double-submit CSRF requires a JS-readable cookie to mirror token in header.
  cookieStore.set(CSRF_TOKEN_NAME, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'strict',
    maxAge: 60 * 60 * 24, // 24h
    path: '/',
  });

  return token;
}

/**
 * Valider un token CSRF
 */
export async function validateCSRFToken(token: string): Promise<boolean> {
  if (!token) return false;

  try {
    const cookieStore = await cookies();
    const storedToken = cookieStore.get(CSRF_TOKEN_NAME)?.value;

    if (!storedToken) return false;

    // Comparaison timing-safe
    return crypto.timingSafeEqual(
      Buffer.from(storedToken),
      Buffer.from(token)
    );
  } catch (error) {
    logger.error('CSRF validation error', error as Error);
    return false;
  }
}

/**
 * Middleware CSRF pour API routes
 * Usage dans une API route:
 * 
 * import { validateCSRFFromRequest } from '@/lib/csrf';
 * 
 * export async function POST(request: Request) {
 *   const isValid = await validateCSRFFromRequest(request);
 *   if (!isValid) {
 *     return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 });
 *   }
 *   // ... suite du traitement
 * }
 */
export async function validateCSRFFromRequest(request: Request): Promise<boolean> {
  // Extraire le token depuis les headers
  const token = request.headers.get('x-csrf-token') || request.headers.get('csrf-token');

  if (!token) {
    logger.csrfError(request.url || 'unknown', 'unknown');
    return false;
  }

  return await validateCSRFToken(token);
}

/**
 * Hook React pour obtenir et inclure le token CSRF
 * Usage côté client:
 * 
 * const csrfToken = await fetch('/api/csrf/token').then(r => r.json());
 * 
 * fetch('/api/sensitive-action', {
 *   method: 'POST',
 *   headers: {
 *     'Content-Type': 'application/json',
 *     'X-CSRF-Token': csrfToken.token,
 *   },
 *   body: JSON.stringify(data)
 * });
 */

/**
 * Générer un hash HMAC pour validation supplémentaire
 */
export function generateHMAC(data: string): string {
  return crypto
    .createHmac('sha256', getCsrfSecret())
    .update(data)
    .digest('hex');
}

/**
 * Valider un hash HMAC
 */
export function validateHMAC(data: string, hash: string): boolean {
  const expectedHash = generateHMAC(data);
  
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedHash),
      Buffer.from(hash)
    );
  } catch {
    return false;
  }
}

