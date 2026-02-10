import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

function authHeaders(req: NextRequest): Record<string, string> {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  const brandId = req.headers.get('X-Brand-Id');
  if (brandId) headers['X-Brand-Id'] = brandId;
  return headers;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const headers = authHeaders(req);
  headers.Authorization = `Bearer ${token}`;
  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/v1/marketplace/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const headers = authHeaders(req);
  headers.Authorization = `Bearer ${token}`;
  try {
    const res = await fetch(`${API_BASE}/api/v1/marketplace/${id}`, {
      method: 'DELETE',
      headers,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}
