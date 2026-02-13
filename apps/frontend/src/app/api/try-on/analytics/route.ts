import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const { searchParams } = new URL(req.url);
  const days = searchParams.get('days') || '30';

  try {
    const res = await fetch(`${API_BASE}/api/v1/try-on/analytics?days=${days}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        raw.error ?? { error: 'Failed to fetch analytics' },
        { status: res.status },
      );
    }
    const data = raw.data ?? raw;
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 },
    );
  }
}
