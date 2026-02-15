import { NextRequest, NextResponse } from 'next/server';
import { authUrl, getAccessToken, setNoCacheHeaders, rawHttpRequest } from '../_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const token = await getAccessToken();

    if (!token) {
      const res = NextResponse.json({ message: 'Not authenticated' }, { status: 401 });
      setNoCacheHeaders(res);
      return res;
    }

    const result = await rawHttpRequest(authUrl('me'), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    let data: unknown;
    try {
      data = JSON.parse(result.body);
    } catch {
      serverLogger.error('[Auth Proxy] Me: backend returned non-JSON');
      const res = NextResponse.json({ message: 'Bad gateway' }, { status: 502 });
      setNoCacheHeaders(res);
      return res;
    }

    const nextRes = NextResponse.json(data, { status: result.statusCode });
    setNoCacheHeaders(nextRes);
    return nextRes;
  } catch (error) {
    serverLogger.error('[Auth Proxy] Me error', error instanceof Error ? error : undefined, { error });
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
