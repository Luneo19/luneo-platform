/**
 * ADMIN ORION SEGMENTS API
 * Proxies to NestJS backend /api/v1/orion/segments
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';
import { buildAdminForwardHeaders } from '@/lib/api/admin-forward-headers';

const API_URL = getBackendUrl();

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const res = await fetch(`${API_URL}/api/v1/admin/orion/segments`, {
      headers: buildAdminForwardHeaders(request),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to fetch segments' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/orion/segments', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch segments' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const res = await fetch(`${API_URL}/api/v1/admin/orion/segments`, {
      method: 'POST',
      headers: buildAdminForwardHeaders(request),
      body: JSON.stringify(body),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to create segment' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/orion/segments', 'POST', error, 500);
    return NextResponse.json({ error: 'Failed to create segment' }, { status: 500 });
  }
}
