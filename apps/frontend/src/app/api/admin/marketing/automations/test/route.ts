/**
 * ADMIN MARKETING AUTOMATIONS TEST API
 * Proxies to NestJS backend POST /api/v1/admin/marketing/automations/test
 */
import { NextRequest, NextResponse } from 'next/server';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';
import { buildAdminForwardHeaders } from '@/lib/api/admin-forward-headers';

const API_URL = getBackendUrl();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${API_URL}/api/v1/admin/marketing/automations/test`, {
      method: 'POST',
      headers: buildAdminForwardHeaders(request),
      body: JSON.stringify(body),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      const payload =
        raw && typeof raw === 'object'
          ? raw
          : { error: typeof raw === 'string' ? raw : 'Failed to test automation' };
      return NextResponse.json(payload, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/marketing/automations/test', 'POST', error);
    return NextResponse.json({ error: 'Failed to test automation' }, { status: 500 });
  }
}
