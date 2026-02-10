/**
 * ADMIN BILLING OVERVIEW API
 * Proxies to NestJS backend /api/v1/admin/billing/overview
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

    const res = await fetch(`${API_URL}/api/v1/admin/billing/overview`, {
      headers: forwardHeaders(request),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to fetch billing overview' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/billing/overview', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch billing overview' }, { status: 500 });
  }
}
