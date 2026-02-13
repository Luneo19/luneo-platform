/**
 * User notifications API proxy.
 * Proxies to NestJS backend /api/v1/notifications so the frontend can call
 * /api/v1/notifications with credentials: 'include' (same-origin, cookies sent).
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';
import { getAccessToken } from '@/app/api/v1/auth/_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

function buildBackendHeaders(request: NextRequest, token: string | undefined): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Cookie: request.headers.get('cookie') || '',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const token = await getAccessToken();
    const { searchParams } = new URL(request.url);
    const url = new URL(`${getBackendUrl()}/api/v1/notifications`);
    searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), {
      method: 'GET',
      headers: buildBackendHeaders(request, token),
    });
    const raw = await res.json().catch(() => ({}));
    return NextResponse.json(raw.data ?? raw, { status: res.status });
  } catch (error) {
    serverLogger.apiError('/api/v1/notifications', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
