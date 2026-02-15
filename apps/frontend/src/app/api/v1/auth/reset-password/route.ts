import { NextRequest, NextResponse } from 'next/server';
import { authUrl, setNoCacheHeaders, rawHttpRequest } from '../_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const bodyStr = JSON.stringify(body);

    const result = await rawHttpRequest(authUrl('reset-password'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyStr).toString(),
      },
      body: bodyStr,
    });

    let data: unknown;
    try {
      data = JSON.parse(result.body);
    } catch {
      serverLogger.error('[Auth Proxy] Reset-password: backend returned non-JSON');
      const res = NextResponse.json({ message: 'Bad gateway' }, { status: 502 });
      setNoCacheHeaders(res);
      return res;
    }

    const nextRes = NextResponse.json(data, { status: result.statusCode });
    setNoCacheHeaders(nextRes);
    return nextRes;
  } catch (error) {
    serverLogger.error('[Auth Proxy] Reset-password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
