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

    // Keep logout UX idempotent: always return 200 once local cookies are cleared,
    // even if backend token revocation is temporarily unavailable.
    const nextRes = NextResponse.json(
      backendLogoutSucceeded
        ? { message: 'Logged out', success: true }
        : {
            message: 'Logged out locally. Remote token revocation is pending.',
            success: true,
            partial: true,
          },
      { status: 200 },
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
    // Never block the user-facing logout flow on proxy-side failures.
    const res = NextResponse.json({ message: 'Logged out', success: true, partial: true }, { status: 200 });
    setNoCacheHeaders(res);
    res.cookies.set('accessToken', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.cookies.set('refreshToken', '', {
      path: '/',
      maxAge: 0,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    res.cookies.set('csrf_token', '', {
      path: '/',
      maxAge: 0,
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return res;
  }
}
