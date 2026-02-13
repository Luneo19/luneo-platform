/**
 * API Proxy: POST /api/ai/generate-design
 * Proxies to NestJS backend POST /api/v1/generation/dashboard/create
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/v1/generation/dashboard/create`, {
      method: 'POST',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const raw = await res.json().catch(() => ({}));
    const data = raw.data ?? raw;

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Failed to create generation' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate design';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
