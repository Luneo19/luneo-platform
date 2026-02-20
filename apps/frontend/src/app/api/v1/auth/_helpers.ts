/**
 * Shared helpers for auth API proxy routes.
 *
 * These proxy routes exist so that:
 * 1. Set-Cookie headers from the backend are reliably forwarded to the browser.
 *    (Vercel rewrites may strip or modify Set-Cookie in certain edge cases.)
 * 2. httpOnly cookies are set on the same origin (luneo.app) for the browser,
 *    removing cross-domain cookie issues.
 *
 * IMPORTANT: Node.js 22 undici consumes httpOnly Set-Cookie headers internally,
 * so `response.headers.getSetCookie()` may return incomplete results.
 * We use `http`/`https` modules for raw access to ALL Set-Cookie headers.
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

/**
 * Raw HTTP request using Node.js http/https modules.
 * This bypasses undici's cookie handling and gives access to ALL Set-Cookie headers.
 */
export function rawHttpRequest(
  url: string,
  options: { method?: string; headers?: Record<string, string>; body?: string },
): Promise<{ statusCode: number; headers: Record<string, string | string[]>; body: string; setCookieHeaders: string[] }> {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const mod = isHttps ? require('https') : require('http');

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
    };

    const req = mod.request(reqOptions, (res: import('http').IncomingMessage) => {
      let body = '';
      res.on('data', (chunk: Buffer) => { body += chunk.toString(); });
      res.on('end', () => {
        // Raw access to ALL set-cookie headers (Node.js http module preserves them)
        const setCookieHeaders = res.headers['set-cookie'] || [];
        resolve({
          statusCode: res.statusCode || 500,
          headers: res.headers as Record<string, string | string[]>,
          body,
          setCookieHeaders: Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders],
        });
      });
    });

    req.on('error', reject);

    // Timeout: 15 seconds
    req.setTimeout(15000, () => {
      req.destroy(new Error('Request timeout'));
    });

    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

/**
 * Parse a single Set-Cookie header string into a structured object.
 */
export function parseSingleCookie(cookieStr: string): {
  name: string;
  value: string;
  path?: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
} {
  const parts = cookieStr.split(';').map((s) => s.trim());
  const [nameValue, ...attrs] = parts;
  const eqIdx = nameValue.indexOf('=');
  const name = nameValue.substring(0, eqIdx);
  const value = nameValue.substring(eqIdx + 1);

  const result: {
    name: string;
    value: string;
    path?: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'lax' | 'strict' | 'none';
  } = { name, value };

  for (const attr of attrs) {
    const lower = attr.toLowerCase();
    if (lower === 'httponly') result.httpOnly = true;
    else if (lower === 'secure') result.secure = true;
    else if (lower.startsWith('path=')) result.path = attr.split('=')[1];
    else if (lower.startsWith('max-age=')) result.maxAge = parseInt(attr.split('=')[1], 10);
    else if (lower.startsWith('samesite=')) {
      const val = attr.split('=')[1]?.toLowerCase();
      if (val === 'lax' || val === 'strict' || val === 'none') result.sameSite = val;
    }
    // Intentionally skip Domain — we want the cookie scoped to the current host (luneo.app)
  }

  return result;
}

/**
 * Parse Set-Cookie header(s) from raw setCookieHeaders array.
 * Returns an array of cookie attribute objects.
 */
export function parseSetCookies(setCookieHeaders: string[]): Array<{
  name: string;
  value: string;
  path?: string;
  maxAge?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'lax' | 'strict' | 'none';
}> {
  return setCookieHeaders.map(parseSingleCookie);
}

/**
 * Forward Set-Cookie headers to the NextResponse.
 * This sets cookies on the same-origin (luneo.app) regardless of what domain
 * the backend specified, ensuring reliable browser cookie storage.
 */
export function forwardCookiesToResponse(
  setCookieHeaders: string[],
  nextResponse: NextResponse,
): void {
  const parsedCookies = parseSetCookies(setCookieHeaders);

  for (const cookie of parsedCookies) {
    nextResponse.cookies.set(cookie.name, cookie.value, {
      path: cookie.path || '/',
      maxAge: cookie.maxAge,
      httpOnly: cookie.httpOnly ?? true,
      secure: cookie.secure ?? process.env.NODE_ENV === 'production',
      sameSite: cookie.sameSite || 'lax',
    });
  }
}

/**
 * Build the full backend URL for an auth endpoint.
 */
export function authUrl(path: string): string {
  return `${API_BASE}/api/v1/auth/${path}`;
}

/**
 * Set no-cache headers on auth responses.
 * Auth responses MUST NEVER be cached by CDN or browser.
 */
export function setNoCacheHeaders(res: NextResponse): void {
  res.headers.set('Cache-Control', 'private, no-cache, no-store, max-age=0, must-revalidate');
  res.headers.set('CDN-Cache-Control', 'private, no-store');
  res.headers.set('Vercel-CDN-Cache-Control', 'private, no-store');
}

/**
 * Read the accessToken cookie from the incoming request.
 */
export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('accessToken')?.value;
}

/**
 * Read the refreshToken cookie from the incoming request.
 */
export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('refreshToken')?.value;
}

/**
 * Safely fetch from the backend and parse JSON response.
 * Returns a proper NextResponse on network or JSON parse errors
 * instead of letting the caller crash with a 500.
 */
export async function safeFetchBackend(
  url: string,
  init: RequestInit,
  label: string,
): Promise<{ backendRes: Response; data: unknown } | NextResponse> {
  let backendRes: Response;
  try {
    backendRes = await fetch(url, init);
  } catch (fetchError) {
    const { serverLogger } = await import('@/lib/logger-server');
    serverLogger.error(`[Auth Proxy] ${label} fetch failed (backend unreachable):`, fetchError);
    const res = NextResponse.json({ message: 'Service temporarily unavailable' }, { status: 503 });
    setNoCacheHeaders(res);
    return res;
  }

  let data: unknown;
  try {
    data = await backendRes.json();
  } catch {
    const { serverLogger } = await import('@/lib/logger-server');
    serverLogger.error(`[Auth Proxy] ${label}: backend returned non-JSON (status ${backendRes.status})`);
    const res = NextResponse.json({ message: 'Bad gateway' }, { status: 502 });
    setNoCacheHeaders(res);
    return res;
  }

  return { backendRes, data };
}
