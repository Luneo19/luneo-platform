import { NextRequest, NextResponse } from 'next/server';
import { authUrl, getRefreshToken, forwardCookiesToResponse, setNoCacheHeaders, rawHttpRequest } from '../_helpers';
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

    const bodyStr = JSON.stringify({ refreshToken });
    const result = await rawHttpRequest(authUrl('refresh'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr).toString(),
        Cookie: `refreshToken=${refreshToken}`,
      },
      body: bodyStr,
    });

    let data: unknown;
    try {
      data = JSON.parse(result.body);
    } catch {
      serverLogger.error('[Auth Proxy] Refresh: backend returned non-JSON');
      const res = NextResponse.json({ message: 'Bad gateway' }, { status: 502 });
      setNoCacheHeaders(res);
      return res;
    }

    const nextRes = NextResponse.json(data, { status: result.statusCode });
    setNoCacheHeaders(nextRes);

    if (result.statusCode >= 200 && result.statusCode < 300) {
      forwardCookiesToResponse(result.setCookieHeaders, nextRes);
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
