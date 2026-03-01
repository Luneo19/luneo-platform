/**
 * ★★★ ADMIN WEBHOOK DETAIL API ★★★
 * Forwards to NestJS backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';
import { buildAdminForwardHeaders } from '@/lib/api/admin-forward-headers';

const API_URL = getBackendUrl();

async function getWebhookId(params: Promise<{ webhookId: string }> | { webhookId: string }): Promise<string> {
  return params instanceof Promise ? (await params).webhookId : params.webhookId;
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ webhookId: string }> | { webhookId: string } }) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const webhookId = await getWebhookId(params);
    const res = await fetch(`${API_URL}/api/v1/admin/webhooks/${webhookId}`, { headers: buildAdminForwardHeaders(request) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data.error ?? { error: 'Failed to fetch webhook' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/webhooks/[webhookId]', 'GET', error);
    return NextResponse.json({ error: 'Failed to fetch webhook' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ webhookId: string }> | { webhookId: string } }) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const webhookId = await getWebhookId(params);
    const body = await request.json();
    const res = await fetch(`${API_URL}/api/v1/admin/webhooks/${webhookId}`, {
      method: 'PATCH',
      headers: buildAdminForwardHeaders(request),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data.error ?? { error: 'Failed to update webhook' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/webhooks/[webhookId]', 'PATCH', error);
    return NextResponse.json({ error: 'Failed to update webhook' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ webhookId: string }> | { webhookId: string } }) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const webhookId = await getWebhookId(params);
    const res = await fetch(`${API_URL}/api/v1/admin/webhooks/${webhookId}`, {
      method: 'DELETE',
      headers: buildAdminForwardHeaders(request),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return NextResponse.json(data.error ?? { error: 'Failed to delete webhook' }, { status: res.status });
    }
    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/webhooks/[webhookId]', 'DELETE', error);
    return NextResponse.json({ error: 'Failed to delete webhook' }, { status: 500 });
  }
}
