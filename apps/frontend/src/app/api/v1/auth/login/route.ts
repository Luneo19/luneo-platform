import { NextRequest, NextResponse } from 'next/server';
import { authUrl, forwardCookiesToResponse, setNoCacheHeaders, safeFetchBackend } from '../_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await safeFetchBackend(
      authUrl('login'),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(req.headers.get('x-forwarded-for')
            ? { 'x-forwarded-for': req.headers.get('x-forwarded-for')! }
            : {}),
        },
        body: JSON.stringify(body),
      },
      'Login',
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
    serverLogger.error('[Auth Proxy] Login error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
