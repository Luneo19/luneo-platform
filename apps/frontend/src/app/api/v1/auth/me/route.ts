import { NextRequest, NextResponse } from 'next/server';
import { authUrl, getAccessToken, setNoCacheHeaders } from '../_helpers';
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

    const backendUrl = authUrl('me');
    const backendRes = await fetch(backendUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    let data: unknown;
    try {
      data = await backendRes.json();
    } catch {
      serverLogger.error('[Auth Proxy] Me: backend returned non-JSON');
      const res = NextResponse.json({ message: 'Bad gateway' }, { status: 502 });
      setNoCacheHeaders(res);
      return res;
    }

    const nextRes = NextResponse.json(data, { status: backendRes.status });
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
