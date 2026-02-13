/**
 * ADMIN MARKETING TEMPLATES DETAIL API
 * Proxies to the Orion communications templates endpoint for individual template operations.
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

async function getId(params: Promise<{ id: string }> | { id: string }): Promise<string> {
  return params instanceof Promise ? (await params).id : params.id;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const id = await getId(params);
    const res = await fetch(`${API_URL}/api/v1/orion/communications/templates/${id}`, {
      headers: forwardHeaders(request),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to fetch template' }, { status: res.status });
    }
    return NextResponse.json(raw.data ?? raw);
  } catch (error) {
    serverLogger.apiError('/api/admin/marketing/templates/[id]', 'GET', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const id = await getId(params);
    const body = await request.json();
    const res = await fetch(`${API_URL}/api/v1/orion/communications/templates/${id}`, {
      method: 'PUT',
      headers: forwardHeaders(request),
      body: JSON.stringify(body),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to update template' }, { status: res.status });
    }
    return NextResponse.json(raw.data ?? raw);
  } catch (error) {
    serverLogger.apiError('/api/admin/marketing/templates/[id]', 'PUT', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const id = await getId(params);
    const res = await fetch(`${API_URL}/api/v1/orion/communications/templates/${id}`, {
      method: 'DELETE',
      headers: forwardHeaders(request),
    });
    if (!res.ok) {
      const raw = await res.json().catch(() => ({}));
      return NextResponse.json(raw.error ?? { error: 'Failed to delete template' }, { status: res.status });
    }
    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/marketing/templates/[id]', 'DELETE', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
