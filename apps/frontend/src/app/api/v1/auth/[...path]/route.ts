/**
 * Catch-all proxy route for auth endpoints not covered by specific route files.
 *
 * Handles:
 *   /api/v1/auth/2fa/setup
 *   /api/v1/auth/2fa/verify
 *   /api/v1/auth/2fa/disable
 *   /api/v1/auth/login/2fa
 *   /api/v1/auth/verify-email
 *   /api/v1/auth/resend-verification
 *   ...and any future auth sub-routes
 *
 * Specific routes (login, signup, logout, me, refresh, forgot-password, reset-password)
 * take precedence in Next.js routing — this catch-all only fires for unmatched paths.
 *
 * Architecture:
 *   - Uses rawHttpRequest (node:http/https) to bypass undici's cookie absorption.
 *   - Forwards Set-Cookie headers on success (some endpoints like login/2fa set tokens).
 *   - Sends Authorization & Cookie headers from the incoming request's httpOnly cookies.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  rawHttpRequest,
  getAccessToken,
  getRefreshToken,
  forwardCookiesToResponse,
  setNoCacheHeaders,
} from '../_helpers';
import { getBackendUrl } from '@/lib/api/server-url';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

const API_BASE = getBackendUrl();

async function proxyAuthRequest(req: NextRequest, method: string) {
  const { pathname } = req.nextUrl;
  // pathname = /api/v1/auth/2fa/setup => backend path = /api/v1/auth/2fa/setup
  const backendUrl = `${API_BASE}${pathname}${req.nextUrl.search}`;
  const label = `[Auth Proxy] ${method} ${pathname}`;

  try {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Forward auth cookies as Authorization / Cookie headers
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    if (refreshToken) headers['Cookie'] = `refreshToken=${refreshToken}`;

    // Forward client IP
    const xff = req.headers.get('x-forwarded-for');
    if (xff) headers['x-forwarded-for'] = xff;

    // Read body for POST/PUT/PATCH
    let bodyStr: string | undefined;
    if (method !== 'GET' && method !== 'HEAD' && method !== 'DELETE') {
      try {
        const raw = await req.text();
        if (raw) {
          bodyStr = raw;
          headers['Content-Length'] = Buffer.byteLength(bodyStr).toString();
        }
      } catch {
        // No body — that's fine for some endpoints
      }
    }

    const result = await rawHttpRequest(backendUrl, {
      method,
      headers,
      body: bodyStr,
    });

    // Parse JSON body
    let data: unknown;
    try {
      data = JSON.parse(result.body);
    } catch {
      serverLogger.error(`${label}: backend returned non-JSON (status ${result.statusCode})`);
      const res = NextResponse.json({ message: 'Bad gateway' }, { status: 502 });
      setNoCacheHeaders(res);
      return res;
    }

    const nextRes = NextResponse.json(data, { status: result.statusCode });
    setNoCacheHeaders(nextRes);

    // Forward Set-Cookie headers on success (e.g., login/2fa sets new tokens)
    if (result.statusCode >= 200 && result.statusCode < 300 && result.setCookieHeaders.length > 0) {
      forwardCookiesToResponse(result.setCookieHeaders, nextRes);
    }

    return nextRes;
  } catch (error) {
    serverLogger.error(`${label} error:`, error);
    const res = NextResponse.json(
      { message: 'Service temporarily unavailable' },
      { status: 503 },
    );
    setNoCacheHeaders(res);
    return res;
  }
}

export async function GET(req: NextRequest) {
  return proxyAuthRequest(req, 'GET');
}

export async function POST(req: NextRequest) {
  return proxyAuthRequest(req, 'POST');
}

export async function PUT(req: NextRequest) {
  return proxyAuthRequest(req, 'PUT');
}

export async function DELETE(req: NextRequest) {
  return proxyAuthRequest(req, 'DELETE');
}
