/**
 * User notification delete API proxy.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';
import { getAccessToken } from '@/app/api/v1/auth/_helpers';
import { serverLogger } from '@/lib/logger-server';

export const dynamic = 'force-dynamic';

function buildBackendHeaders(request: NextRequest, token: string | undefined): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Cookie: request.headers.get('cookie') || '',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getAccessToken();
    const { id } = await params;
    const res = await fetch(`${getBackendUrl()}/api/v1/notifications/${id}`, {
      method: 'DELETE',
      headers: buildBackendHeaders(request, token),
    });
    const raw = await res.json().catch(() => ({}));
    return NextResponse.json(raw.data ?? raw, { status: res.status });
  } catch (error) {
    serverLogger.apiError('/api/v1/notifications/[id]', 'DELETE', error, 500);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
