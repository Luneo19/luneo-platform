/**
 * ★★★ ADMIN WEBHOOKS API ★★★
 * Forwards to NestJS backend.
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

    const { searchParams } = new URL(request.url);
    const url = new URL(`${API_URL}/api/v1/admin/webhooks`);
    searchParams.forEach((v, k) => url.searchParams.set(k, v));

    const res = await fetch(url.toString(), { headers: buildAdminForwardHeaders(request) });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to fetch webhooks' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/webhooks', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch webhooks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const res = await fetch(`${API_URL}/api/v1/admin/webhooks`, {
      method: 'POST',
      headers: buildAdminForwardHeaders(request),
      body: JSON.stringify(body),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to create webhook' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data, { status: res.status === 201 ? 201 : 200 });
  } catch (error) {
    serverLogger.apiError('/api/admin/webhooks', 'POST', error, 500);
    return NextResponse.json({ error: 'Failed to create webhook' }, { status: 500 });
  }
}
