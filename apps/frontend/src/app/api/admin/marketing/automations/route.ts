/**
 * ★★★ ADMIN MARKETING AUTOMATIONS API ★★★
 * Forwards to NestJS backend.
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
  if (auth) (headers as Record<string, string>)['Authorization'] = auth;
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const res = await fetch(`${API_URL}/api/v1/admin/marketing/automations`, {
      headers: forwardHeaders(request),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to fetch automations' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/marketing/automations', 'GET', error);
    return NextResponse.json({ error: 'Failed to fetch automations' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const body = await request.json();
    const res = await fetch(`${API_URL}/api/v1/admin/marketing/automations`, {
      method: 'POST',
      headers: forwardHeaders(request),
      body: JSON.stringify(body),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to create automation' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data, { status: res.status === 201 ? 201 : 200 });
  } catch (error) {
    serverLogger.apiError('/api/admin/marketing/automations', 'POST', error);
    return NextResponse.json({ error: 'Failed to create automation' }, { status: 500 });
  }
}
