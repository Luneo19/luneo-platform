/**
 * ADMIN ORION SEED API
 * Proxies to NestJS backend POST /api/v1/orion/seed
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';
import { buildAdminForwardHeaders } from '@/lib/api/admin-forward-headers';

const API_URL = getBackendUrl();

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const res = await fetch(`${API_URL}/api/v1/admin/orion/seed`, {
      method: 'POST',
      headers: buildAdminForwardHeaders(request),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data.error ?? { error: 'Failed to seed ORION agents' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/orion/seed', 'POST', error, 500);
    return NextResponse.json({ error: 'Failed to seed ORION agents' }, { status: 500 });
  }
}
