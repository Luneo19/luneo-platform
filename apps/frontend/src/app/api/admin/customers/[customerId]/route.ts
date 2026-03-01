/**
 * ★★★ ADMIN CUSTOMER DETAIL API ★★★
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
  if (auth) headers['Authorization'] = auth;
  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> | { customerId: string } }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { customerId } = resolvedParams;
    const normalizedCustomerId = customerId.toLowerCase();

    const res = await fetch(`${API_URL}/api/v1/admin/customers/${normalizedCustomerId}`, {
      headers: forwardHeaders(request),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to fetch customer details' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/customers/[customerId]', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch customer details' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> | { customerId: string } }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { customerId } = resolvedParams;
    const normalizedCustomerId = customerId.toLowerCase();
    const body = await request.json().catch(() => ({}));

    const res = await fetch(`${API_URL}/api/v1/admin/customers/${normalizedCustomerId}`, {
      method: 'PATCH',
      headers: forwardHeaders(request),
      body: JSON.stringify(body),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to update customer' }, { status: res.status });
    }
    return NextResponse.json(raw);
  } catch (error) {
    serverLogger.apiError('/api/admin/customers/[customerId]', 'PATCH', error, 500);
    return NextResponse.json({ error: 'Failed to update customer' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerId: string }> | { customerId: string } }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const resolvedParams = params instanceof Promise ? await params : params;
    const { customerId } = resolvedParams;
    const normalizedCustomerId = customerId.toLowerCase();

    const res = await fetch(`${API_URL}/api/v1/admin/customers/${normalizedCustomerId}`, {
      method: 'DELETE',
      headers: forwardHeaders(request),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to delete customer' }, { status: res.status });
    }
    return NextResponse.json(raw);
  } catch (error) {
    serverLogger.apiError('/api/admin/customers/[customerId]', 'DELETE', error, 500);
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 });
  }
}
