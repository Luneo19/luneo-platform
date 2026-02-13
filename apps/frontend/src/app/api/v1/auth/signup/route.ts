import { NextRequest, NextResponse } from 'next/server';
import { authUrl, forwardCookiesToResponse, setNoCacheHeaders, safeFetchBackend } from '../_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await safeFetchBackend(
      authUrl('signup'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      'Signup',
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
    serverLogger.error('[Auth Proxy] Signup error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
