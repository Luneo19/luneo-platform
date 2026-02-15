/**
 * ADMIN ANALYTICS TRENDS API
 * Proxies to the analytics advanced predictions endpoint for trend data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

function forwardHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {
    Cookie: request.headers.get('cookie') || '',
  };
  const auth = request.headers.get('authorization');
  if (auth) headers['Authorization'] = auth;
  return headers;
}

function emptyTrendsData(days: number) {
  const now = Date.now();
  const points = Array.from({ length: days }, (_, i) => {
    const date = new Date(now - (days - 1 - i) * 86400000);
    return {
      date: date.toISOString().split('T')[0],
      revenue: 0,
      users: 0,
      designs: 0,
    };
  });
  return { data: points, period: `${days}d`, empty: true };
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Try fetching from analytics advanced predictions endpoint
    try {
      const url = new URL(`${API_URL}/api/v1/analytics/advanced/predictions`);
      url.searchParams.set('days', String(days));

      const res = await fetch(url.toString(), { headers: forwardHeaders(request) });
      if (res.ok) {
        const raw = await res.json().catch(() => ({}));
        const data = raw.data ?? raw;
        return NextResponse.json(data);
      }
    } catch {
      // Backend endpoint not available, fall through to generated data
    }

    // Fallback: return empty trends data (no mock data in production)
    return NextResponse.json(emptyTrendsData(days));
  } catch (error) {
    serverLogger.apiError('/api/admin/analytics/trends', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch trends data' }, { status: 500 });
  }
}
