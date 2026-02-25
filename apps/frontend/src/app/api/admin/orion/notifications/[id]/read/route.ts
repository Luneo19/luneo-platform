/**
 * ADMIN ORION NOTIFICATION MARK READ API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { getBackendUrl } from '@/lib/api/server-url';
import { buildAdminForwardHeaders } from '@/lib/api/admin-forward-headers';

const API_URL = getBackendUrl();

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
    const res = await fetch(`${API_URL}/api/v1/admin/orion/notifications/${id}/read`, {
      method: 'PUT',
      headers: buildAdminForwardHeaders(request),
    });
    const raw = await res.json().catch(() => ({}));
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
