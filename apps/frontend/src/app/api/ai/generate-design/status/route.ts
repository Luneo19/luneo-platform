/**
 * API Proxy: GET /api/ai/generate-design/status?publicId=xxx
 * Proxies to NestJS backend GET /api/v1/generation/:publicId/status
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const publicId = req.nextUrl.searchParams.get('publicId');

  if (!publicId) {
    return NextResponse.json({ error: 'publicId is required' }, { status: 400 });
  }

  try {
    const res = await fetch(`${API_BASE}/api/v1/generation/${publicId}/status`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Cookie': req.headers.get('cookie') || '',
      },
    });

    const raw = await res.json().catch(() => ({}));
    const data = raw.data ?? raw;

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || 'Failed to get status' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to get generation status';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
