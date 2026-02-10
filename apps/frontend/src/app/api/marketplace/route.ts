import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const { searchParams } = new URL(req.url);
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const brandId = req.headers.get('X-Brand-Id');
  if (brandId) headers['X-Brand-Id'] = brandId;
  try {
    const res = await fetch(`${API_BASE}/api/v1/marketplace?${searchParams.toString()}`, {
      headers,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch marketplace items' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const brandId = req.headers.get('X-Brand-Id');
  if (brandId) headers['X-Brand-Id'] = brandId;
  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/v1/marketplace`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
