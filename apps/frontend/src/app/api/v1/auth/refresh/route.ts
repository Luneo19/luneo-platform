import { NextRequest, NextResponse } from 'next/server';
import { authUrl, getRefreshToken, setNoCacheHeaders, rawHttpRequest, forwardCookiesToResponse } from '../_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const refreshToken = await getRefreshToken();

    if (!refreshToken) {
      const res = NextResponse.json({ message: 'No refresh token' }, { status: 401 });
      setNoCacheHeaders(res);
      return res;
    }

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Cookie: `refreshToken=${refreshToken}`,
      };
    const csrf = req.headers.get('x-csrf-token');
    if (csrf) headers['x-csrf-token'] = csrf;

    const backendRes = await rawHttpRequest(authUrl('refresh'), {
      method: 'POST',
      headers,
      body: JSON.stringify({ refreshToken }),
    });

    let data: unknown;
    try {
      data = backendRes.body ? JSON.parse(backendRes.body) : {};
    } catch {
      serverLogger.error('[Auth Proxy] Refresh: backend returned non-JSON');
      const res = NextResponse.json({ message: 'Bad gateway' }, { status: 502 });
      setNoCacheHeaders(res);
      return res;
    }

    const nextRes = NextResponse.json(data, { status: backendRes.statusCode });
    setNoCacheHeaders(nextRes);

    if (backendRes.statusCode >= 200 && backendRes.statusCode < 300) {
      forwardCookiesToResponse(backendRes.setCookieHeaders, nextRes);
    } else if (backendRes.statusCode === 401) {
      // Keep frontend and backend session state aligned when refresh is invalid/rotated.
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
    }

    return nextRes;
  } catch (error) {
    serverLogger.error('[Auth Proxy] Refresh error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
