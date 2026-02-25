import { NextRequest, NextResponse } from 'next/server';
import { authUrl, getAccessToken, getRefreshToken, setNoCacheHeaders } from '../_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = await getAccessToken();
    const refreshToken = await getRefreshToken();
    const incomingCookieHeader = req.headers.get('cookie');
    const csrfCookie = req.cookies.get('csrf_token')?.value;
    let backendLogoutSucceeded = false;

    if (token || refreshToken) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        // Forward the full browser cookie header when available so backend CSRF guard
        // can validate both x-csrf-token header and csrf_token cookie consistently.
        if (incomingCookieHeader) {
          headers['Cookie'] = incomingCookieHeader;
        } else {
          const cookieParts: string[] = [];
          if (refreshToken) cookieParts.push(`refreshToken=${refreshToken}`);
          if (csrfCookie) cookieParts.push(`csrf_token=${csrfCookie}`);
          if (cookieParts.length > 0) {
            headers['Cookie'] = cookieParts.join('; ');
          }
        }
        const csrf = req.headers.get('x-csrf-token');
        if (csrf) headers['x-csrf-token'] = csrf;

        const backendRes = await fetch(authUrl('logout'), {
          method: 'POST',
          headers,
          body: JSON.stringify({ refreshToken }),
          cache: 'no-store',
        });
        backendLogoutSucceeded = backendRes.ok;
      } catch {
        backendLogoutSucceeded = false;
      }
    } else {
      backendLogoutSucceeded = true;
    }

    const nextRes = backendLogoutSucceeded
      ? NextResponse.json({ message: 'Logged out' }, { status: 200 })
      : NextResponse.json(
          {
            message:
              'Logout partially completed. Please retry to fully revoke your session.',
          },
          { status: 503 },
        );
    setNoCacheHeaders(nextRes);

    nextRes.cookies.set('accessToken', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    nextRes.cookies.set('refreshToken', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    nextRes.cookies.set('csrf_token', '', {
      path: '/',
      maxAge: 0,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return nextRes;
  } catch (error) {
    serverLogger.error('[Auth Proxy] Logout error:', error);
    const res = NextResponse.json(
      { message: 'Internal server error' },
      { status: 503 },
    );
    setNoCacheHeaders(res);
    return res;
  }
}
