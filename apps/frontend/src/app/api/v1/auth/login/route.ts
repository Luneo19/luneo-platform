import { NextRequest, NextResponse } from 'next/server';
import { authUrl, forwardCookiesToResponse, setNoCacheHeaders } from '../_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const backendRes = await fetch(authUrl('login'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Forward client IP for brute-force tracking
        ...(req.headers.get('x-forwarded-for')
          ? { 'x-forwarded-for': req.headers.get('x-forwarded-for')! }
          : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await backendRes.json();

    const nextRes = NextResponse.json(data, { status: backendRes.status });
    setNoCacheHeaders(nextRes);

    // Forward httpOnly cookies (accessToken, refreshToken) from backend to browser
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
