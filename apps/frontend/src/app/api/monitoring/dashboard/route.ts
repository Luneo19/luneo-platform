/**
 * Monitoring Dashboard API
 * Proxies to backend GET /api/v1/health/detailed and maps response to dashboard shape.
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';
import { serverLogger } from '@/lib/logger-server';
import type { ServiceHealth } from '@/lib/monitoring/types';

const BACKEND = getBackendUrl();

function mapStatus(s: string): 'healthy' | 'degraded' | 'unhealthy' {
  if (s === 'ok') return 'healthy';
  if (s === 'degraded') return 'degraded';
  return 'unhealthy';
}

export async function GET(request: NextRequest) {
  try {
    const auth = request.headers.get('authorization');
    const cookie = request.headers.get('cookie') || '';
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (auth) headers['Authorization'] = auth;
    if (cookie) headers['Cookie'] = cookie;

    const res = await fetch(BACKEND + '/api/v1/health/detailed', {
      headers,
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      serverLogger.apiError('/api/monitoring/dashboard', 'GET', new Error(errText || res.statusText), res.status);
      return NextResponse.json(
        { success: false, error: errText || 'Failed to fetch health' },
        { status: res.status }
      );
    }

    const raw = await res.json();
    const deps = raw.dependencies || raw.data?.dependencies || {};
    const services: ServiceHealth[] = Object.entries(deps).map(([name, dep]: [string, unknown]) => {
      const d = dep as { status?: string; latencyMs?: number; message?: string };
      return {
        name: name.charAt(0).toUpperCase() + name.slice(1),
        status: mapStatus(d?.status ?? 'unhealthy'),
        latency: d?.latencyMs,
        message: d?.message,
        lastCheck: Date.now(),
      };
    });

    const metrics = raw.metrics
      ? {
          activeUsers: 0,
          requestsPerMinute: 0,
          errorRate: 0,
          avgResponseTime: raw.metrics.latencyP95Ms ?? 0,
          totalRequests24h: raw.metrics.requestCountTotal ?? 0,
          totalErrors24h: 0,
          uniqueVisitors24h: 0,
          peakRPM: 0,
          services: {} as Record<string, ServiceHealth>,
          avgWebVitals: {},
        }
      : null;

    return NextResponse.json({
      success: true,
      data: { metrics, alerts: [], services },
    });
  } catch (error) {
    serverLogger.apiError('/api/monitoring/dashboard', 'GET', error, 500);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
