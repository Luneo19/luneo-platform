import { NextRequest, NextResponse } from 'next/server';
import { authUrl, getAccessToken, getRefreshToken, setNoCacheHeaders, rawHttpRequest } from '../_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const token = await getAccessToken();
    const refreshToken = await getRefreshToken();

    // Call backend logout (best-effort — invalidates refresh token in DB)
    if (token || refreshToken) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        if (refreshToken) headers['Cookie'] = `refreshToken=${refreshToken}`;

        const bodyStr = JSON.stringify({ refreshToken });
        headers['Content-Length'] = Buffer.byteLength(bodyStr).toString();

        await rawHttpRequest(authUrl('logout'), {
          method: 'POST',
          headers,
          body: bodyStr,
        });
      } catch {
        // Ignore backend errors — we'll clear cookies regardless
      }
    }

    // Clear cookies on the browser regardless of backend response
    const nextRes = NextResponse.json({ message: 'Logged out' }, { status: 200 });
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

    return nextRes;
  } catch (error) {
    serverLogger.error('[Auth Proxy] Logout error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
