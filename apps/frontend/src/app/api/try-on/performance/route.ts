import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';

const BACKEND_URL = getBackendUrl();

/**
 * Proxy endpoint for performance metrics.
 * GET: fetch device stats
 * POST: not used directly (uses session-specific endpoint)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = searchParams.get('days') || '30';

    const authHeader = request.headers.get('authorization');

    const response = await fetch(
      `${BACKEND_URL}/api/v1/try-on/performance/device-stats?days=${encodeURIComponent(days)}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch performance data' },
      { status: 500 },
    );
  }
}
