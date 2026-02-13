import { NextRequest, NextResponse } from 'next/server';
import { authUrl, safeFetchBackend } from '../_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await safeFetchBackend(
      authUrl('reset-password'),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
      'Reset-password',
    );

    if (result instanceof NextResponse) return result;
    const { backendRes, data } = result;

    return NextResponse.json(data, { status: backendRes.status });
  } catch (error) {
    serverLogger.error('[Auth Proxy] Reset-password error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
