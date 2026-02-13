/**
 * ADMIN ORION COMMUNICATIONS TEMPLATE BY ID API
 * Proxies to NestJS backend GET + PUT + DELETE /api/v1/orion/communications/templates/:id
 */
export const dynamic = 'force-dynamic';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const res = await fetch(`${API_URL}/api/v1/orion/communications/templates/${id}`, {
      headers: forwardHeaders(request),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to fetch ORION communications template' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/orion/communications/templates/[id]', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch ORION communications template' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${API_URL}/api/v1/orion/communications/templates/${id}`, {
      method: 'PUT',
      headers: forwardHeaders(request),
      body: JSON.stringify(body),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to update ORION communications template' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/orion/communications/templates/[id]', 'PUT', error, 500);
    return NextResponse.json({ error: 'Failed to update ORION communications template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const res = await fetch(`${API_URL}/api/v1/orion/communications/templates/${id}`, {
      method: 'DELETE',
      headers: forwardHeaders(request),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to delete ORION communications template' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/orion/communications/templates/[id]', 'DELETE', error, 500);
    return NextResponse.json({ error: 'Failed to delete ORION communications template' }, { status: 500 });
  }
}
