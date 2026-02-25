/**
 * ADMIN ORION SEGMENTS API - DELETE segment
 * Proxies to NestJS backend DELETE /api/v1/orion/segments/:id
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';
import { buildAdminForwardHeaders } from '@/lib/api/admin-forward-headers';

const API_URL = getBackendUrl();

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { id } = await params;
    const res = await fetch(`${API_URL}/api/v1/admin/orion/segments/${id}`, {
      method: 'DELETE',
      headers: buildAdminForwardHeaders(_request),
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(raw.error ?? { error: 'Failed to delete segment' }, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/orion/segments/[id]', 'DELETE', error, 500);
    return NextResponse.json({ error: 'Failed to delete segment' }, { status: 500 });
  }
}
