import { NextRequest, NextResponse } from 'next/server';
import { authUrl, getAccessToken, setNoCacheHeaders, safeFetchBackend } from '../_helpers';
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

    const result = await safeFetchBackend(
      authUrl('me'),
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
      'Me',
    );

    if (result instanceof NextResponse) return result;
    const { backendRes, data } = result;

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
