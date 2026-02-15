/**
 * ADMIN ANALYTICS HEATMAP API
 * Proxies to the analytics-clean metrics endpoint for heatmap-like data.
 * Falls back to generated data when the backend endpoint is not available.
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

function emptyHeatmapData(days: number) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const daysOfWeek = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
  const data = daysOfWeek.map((day) => ({
    day,
    hours: hours.map((hour) => ({
      hour,
      value: 0,
    })),
  }));
  return { data, period: `${days}d`, empty: true };
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    // Try fetching from analytics-clean metrics endpoint
    try {
      const url = new URL(`${API_URL}/api/v1/analytics-clean/metrics`);
      url.searchParams.set('days', String(days));
      url.searchParams.set('type', 'heatmap');

      const res = await fetch(url.toString(), { headers: forwardHeaders(request) });
      if (res.ok) {
        const raw = await res.json().catch(() => ({}));
        const data = raw.data ?? raw;
        return NextResponse.json(data);
      }
    } catch {
      // Backend endpoint not available, fall through to generated data
    }

    // Fallback: return empty heatmap data (no mock data in production)
    return NextResponse.json(emptyHeatmapData(days));
  } catch (error) {
    serverLogger.apiError('/api/admin/analytics/heatmap', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch heatmap data' }, { status: 500 });
  }
}
