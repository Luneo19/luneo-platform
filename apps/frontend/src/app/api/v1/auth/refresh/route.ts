import { NextRequest, NextResponse } from 'next/server';
import { authUrl, getRefreshToken, forwardCookiesToResponse, setNoCacheHeaders } from '../_helpers';
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

    // The backend accepts the refresh token either via cookie or body
    const backendRes = await fetch(authUrl('refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward the refresh token cookie to the backend
        Cookie: `refreshToken=${refreshToken}`,
      },
      body: JSON.stringify({ refreshToken }),
    });

    const data = await backendRes.json();
    const nextRes = NextResponse.json(data, { status: backendRes.status });
    setNoCacheHeaders(nextRes);

    // Forward new cookies (new accessToken + refreshToken) from backend to browser
    if (backendRes.ok) {
      forwardCookiesToResponse(backendRes, nextRes);
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
