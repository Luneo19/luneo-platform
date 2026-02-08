/**
 * ★★★ ADMIN WEBHOOK TEST API ★★★
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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ webhookId: string }> | { webhookId: string } }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const resolvedParams = params instanceof Promise ? await params : params;
    const { webhookId } = resolvedParams;
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${API_URL}/api/v1/admin/webhooks/${webhookId}/test`, {
      method: 'POST',
      headers: forwardHeaders(request),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data.error ?? { error: 'Failed to test webhook' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/webhooks/[webhookId]/test', 'POST', error, 500);
    return NextResponse.json({ error: 'Failed to test webhook' }, { status: 500 });
  }
}
