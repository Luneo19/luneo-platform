/**
 * ★★★ ADMIN CUSTOMER DETAIL API ★★★
 * Forwards to NestJS backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { serverLogger } from '@/lib/logger-server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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

    const { customerId } = typeof (params as any).then === 'function' ? await (params as Promise<{ customerId: string }>) : (params as { customerId: string });

    const res = await fetch(`${API_URL}/api/v1/admin/customers/${customerId}`, {
      headers: forwardHeaders(request),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data.error ?? { error: 'Failed to fetch customer details' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/customers/[customerId]', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch customer details' }, { status: 500 });
  }
}
