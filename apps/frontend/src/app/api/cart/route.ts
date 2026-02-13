/**
 * API Proxy: Cart operations
 * GET /api/cart?brandId=xxx - Get cart
 * POST /api/cart - Add item
 * DELETE /api/cart?brandId=xxx - Clear cart
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

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const brandId = req.nextUrl.searchParams.get('brandId') || '';

  try {
    const res = await fetch(`${API_BASE}/api/v1/cart?brandId=${brandId}`, {
      headers: getHeaders(req, token),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data.data ?? data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to get cart' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/v1/cart/items`, {
      method: 'POST',
      headers: getHeaders(req, token),
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data.data ?? data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to add item' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const brandId = req.nextUrl.searchParams.get('brandId') || '';

  try {
    const res = await fetch(`${API_BASE}/api/v1/cart?brandId=${brandId}`, {
      method: 'DELETE',
      headers: getHeaders(req, token),
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data.data ?? data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to clear cart' }, { status: 500 });
  }
}
