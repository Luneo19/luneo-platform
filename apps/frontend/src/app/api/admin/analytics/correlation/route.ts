/**
 * ADMIN ANALYTICS CORRELATION API
 * Proxies to the analytics advanced correlations endpoint.
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

// ADMIN FIX: Removed generateCorrelationData() which returned random values.
// Correlation data must come from the backend analytics service or return 503.

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30';

    // Fetch from backend analytics advanced correlations endpoint
    try {
      const url = new URL(`${API_URL}/api/v1/analytics/advanced/correlations`);
      url.searchParams.set('days', days);

      const res = await fetch(url.toString(), { headers: forwardHeaders(request) });
      if (res.ok) {
        const raw = await res.json().catch(() => ({}));
        const data = raw.data ?? raw;
        return NextResponse.json(data);
      }
    } catch {
      // Backend endpoint not available
    }

    // FIX: Return 503 instead of random data when backend is unavailable
    return NextResponse.json(
      { error: 'Analytics correlation service unavailable', available: false },
      { status: 503 },
    );
  } catch (error) {
    serverLogger.apiError('/api/admin/analytics/correlation', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch correlation data' }, { status: 500 });
  }
}
