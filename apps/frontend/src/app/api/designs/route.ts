import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const { searchParams } = new URL(req.url);

  const API_BASE = getBackendUrl();
  try {
    const res = await fetch(`${API_BASE}/api/v1/designs?${searchParams.toString()}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json(raw, { status: res.status });
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch designs' }, { status: 500 });
  }
}
