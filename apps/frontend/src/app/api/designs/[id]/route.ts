import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

type RouteContext = { params: Promise<{ id: string }> };

function getAuthHeaders() {
  return async () => {
    const cookieStore = await cookies();
    const token = cookieStore.get('accessToken')?.value;
    return {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };
}

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const headers = await getAuthHeaders()();
  try {
    const res = await fetch(`${API_BASE}/api/v1/designs/${id}`, { headers });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch design' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const headers = await getAuthHeaders()();
  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/v1/designs/${id}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to update design' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const { id } = await params;
  const headers = await getAuthHeaders()();
  try {
    const res = await fetch(`${API_BASE}/api/v1/designs/${id}`, { method: 'DELETE', headers });
    if (res.status === 204) return new NextResponse(null, { status: 204 });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return NextResponse.json(data, { status: res.status });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to delete design' }, { status: 500 });
  }
}
