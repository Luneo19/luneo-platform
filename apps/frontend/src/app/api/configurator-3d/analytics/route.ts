import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  const days = req.nextUrl.searchParams.get('days') || '30';

  try {
    const res = await fetch(`${API_BASE}/api/v1/configurator-3d/analytics?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const raw = await res.json();
    const data = raw.data ?? raw;

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({
      totalSessions: 0,
      savedConfigs: 0,
      avgSessionDuration: 0,
      productsConfigured: 0,
      sessionsOverTime: [],
      topProducts: [],
      categoryBreakdown: [],
    });
  }
}
