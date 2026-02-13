import { NextRequest, NextResponse } from 'next/server';
import { authUrl, getRefreshToken, forwardCookiesToResponse, setNoCacheHeaders, safeFetchBackend } from '../_helpers';
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

    const result = await safeFetchBackend(
      authUrl('refresh'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: `refreshToken=${refreshToken}`,
        },
        body: JSON.stringify({ refreshToken }),
      },
      'Refresh',
    );

    if (result instanceof NextResponse) return result;
    const { backendRes, data } = result;

    const nextRes = NextResponse.json(data, { status: backendRes.status });
    setNoCacheHeaders(nextRes);

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
