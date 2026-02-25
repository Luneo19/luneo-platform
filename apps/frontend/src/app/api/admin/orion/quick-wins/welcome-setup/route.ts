/**
 * ADMIN ORION QUICK-WINS WELCOME-SETUP API
 * Proxies to NestJS backend POST /api/v1/orion/quick-wins/welcome-setup
 */
export const dynamic = 'force-dynamic';
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

    const body = await request.json().catch(() => ({}));
    const res = await fetch(`${API_URL}/api/v1/admin/orion/quick-wins/welcome-setup`, {
      method: 'POST',
      headers: buildAdminForwardHeaders(request),
      body: JSON.stringify(body),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to run ORION quick-wins welcome-setup' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/orion/quick-wins/welcome-setup', 'POST', error, 500);
    return NextResponse.json({ error: 'Failed to run ORION quick-wins welcome-setup' }, { status: 500 });
  }
}
