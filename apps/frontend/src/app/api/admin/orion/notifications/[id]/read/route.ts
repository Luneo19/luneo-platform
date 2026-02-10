/**
 * ADMIN ORION NOTIFICATION MARK READ API
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
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
    const res = await fetch(`${API_URL}/api/v1/orion/notifications/${id}/read`, {
      method: 'PUT',
      headers: forwardHeaders(request),
    });
    const raw = await res.json().catch(() => ({}));
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
