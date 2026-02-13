/**
 * API Proxy: Single order operations
 * GET /api/orders/:id - Get order details
 */
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const { id } = await params;

  try {
    const res = await fetch(`${API_BASE}/api/v1/orders/${id}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Cookie': req.headers.get('cookie') || '',
      },
    });
    const raw = await res.json().catch(() => ({}));
    return NextResponse.json(raw.data ?? raw, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}
