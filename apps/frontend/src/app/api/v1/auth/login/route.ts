import { NextRequest, NextResponse } from 'next/server';
import { authUrl, setNoCacheHeaders, rawHttpRequest, forwardCookiesToResponse } from '../_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bodyStr = JSON.stringify(body);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const xff = req.headers.get('x-forwarded-for');
    if (xff) headers['x-forwarded-for'] = xff;
    const csrf = req.headers.get('x-csrf-token');
    if (csrf) headers['x-csrf-token'] = csrf;
    const cookie = req.headers.get('cookie');
    if (cookie) headers['cookie'] = cookie;

    const backendRes = await rawHttpRequest(authUrl('login'), {
      method: 'POST',
      headers,
      body: bodyStr,
    });

    let data: unknown;
    try {
      data = backendRes.body ? JSON.parse(backendRes.body) : {};
    } catch {
      serverLogger.error('[Auth Proxy] Login: backend returned non-JSON');
      const res = NextResponse.json({ message: 'Bad gateway' }, { status: 502 });
      setNoCacheHeaders(res);
      return res;
    }

    const nextRes = NextResponse.json(data, { status: backendRes.statusCode });
    setNoCacheHeaders(nextRes);

    if (backendRes.statusCode >= 200 && backendRes.statusCode < 300) {
      forwardCookiesToResponse(backendRes.setCookieHeaders, nextRes);
    }

    return nextRes;
  } catch (error) {
    serverLogger.error('[Auth Proxy] Login error:', error);
    return NextResponse.json(
      { message: 'Service temporarily unavailable' },
      { status: 503 },
    );
  }
}
