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
      'Content-Type': req.headers.get('content-type') || 'application/json',
    };

    // Forward auth cookies as Authorization / Cookie headers.
    // Prefer full inbound cookie header to keep csrf_token and any auth cookies in sync.
    const inboundCookie = req.headers.get('cookie');
    const accessToken = await getAccessToken();
    const refreshToken = await getRefreshToken();
    if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
    if (inboundCookie) headers['Cookie'] = inboundCookie;
    else if (refreshToken) headers['Cookie'] = `refreshToken=${refreshToken}`;

    const csrfHeader = req.headers.get('x-csrf-token');
    if (csrfHeader) {
      headers['x-csrf-token'] = csrfHeader;
    }

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

    // Handle OAuth and other redirects safely.
    const locationHeader = result.headers['location'];
    const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader;
    if (result.statusCode >= 300 && result.statusCode < 400 && typeof location === 'string' && location.length > 0) {
      const redirectUrl = location.startsWith('http') ? location : new URL(location, req.nextUrl.origin).toString();
      const redirectRes = NextResponse.redirect(redirectUrl, { status: result.statusCode });
      setNoCacheHeaders(redirectRes);
      if (result.setCookieHeaders.length > 0) {
        forwardCookiesToResponse(result.setCookieHeaders, redirectRes);
      }
      return redirectRes;
    }

    const contentTypeHeader = result.headers['content-type'];
    const contentType = Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader;
    const isJson = typeof contentType === 'string' && contentType.includes('application/json');
    let nextRes: NextResponse;
    if (isJson) {
      try {
        nextRes = NextResponse.json(JSON.parse(result.body || '{}'), { status: result.statusCode });
      } catch {
        serverLogger.error(`${label}: invalid JSON payload from backend (status ${result.statusCode})`);
        const badGateway = NextResponse.json({ message: 'Bad gateway' }, { status: 502 });
        setNoCacheHeaders(badGateway);
        return badGateway;
      }
    } else {
      nextRes = new NextResponse(result.body ?? '', {
        status: result.statusCode,
        headers: contentType ? { 'Content-Type': contentType } : undefined,
      });
    }
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

export async function PATCH(req: NextRequest) {
  return proxyAuthRequest(req, 'PATCH');
}
