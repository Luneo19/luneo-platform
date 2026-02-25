/**
 * ADMIN ORION NOTIFICATIONS API
 * Proxies to NestJS backend /api/v1/orion/notifications
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

function forwardHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Cookie: request.headers.get('cookie') || '',
  };
  const auth = request.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const url = new URL(`${API_URL}/api/v1/admin/orion/notifications`);
    searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), { headers: forwardHeaders(request) });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to fetch notifications' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/orion/notifications', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
