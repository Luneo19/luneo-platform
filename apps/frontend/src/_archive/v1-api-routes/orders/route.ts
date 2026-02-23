/**
 * API Proxy: Orders
 * POST /api/orders - Create order (returns Stripe checkout URL)
 * GET /api/orders - List orders
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

function getHeaders(req: NextRequest, token?: string): HeadersInit {
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
    'Cookie': req.headers.get('cookie') || '',
  };
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/v1/orders`, {
      method: 'POST',
      headers: getHeaders(req, token),
      body: JSON.stringify(body),
    });

    const raw = await res.json().catch(() => ({}));
    const data = raw.data ?? raw;

    if (!res.ok) {
      return NextResponse.json(
        { error: data.message || data.error || 'Failed to create order' },
        { status: res.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to create order';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const searchParams = req.nextUrl.searchParams.toString();

  try {
    const res = await fetch(`${API_BASE}/api/v1/orders?${searchParams}`, {
      headers: getHeaders(req, token),
    });
    const raw = await res.json().catch(() => ({}));
    return NextResponse.json(raw.data ?? raw, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}
