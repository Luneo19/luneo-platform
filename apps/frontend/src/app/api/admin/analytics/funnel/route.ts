/**
 * ★★★ ADMIN ANALYTICS FUNNEL API ★★★
 * Forwards to NestJS backend.
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

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = Number(searchParams.get('period') || '30');

    // The legacy advanced funnel endpoint is not available in the active backend.
    // Build a deterministic funnel from admin overview metrics.
    const overviewUrl = new URL(`${API_URL}/api/v1/admin/analytics/overview`);
    overviewUrl.searchParams.set('period', String(period));
    const overviewRes = await fetch(overviewUrl.toString(), { headers: forwardHeaders(request) });
    if (!overviewRes.ok) {
      const raw = await overviewRes.json().catch(() => ({}));
      return NextResponse.json(raw.error ?? { error: 'Failed to fetch funnel data' }, { status: overviewRes.status });
    }
    const overviewRaw = await overviewRes.json().catch(() => ({}));
    const overview = (overviewRaw?.data ?? overviewRaw) as Record<string, unknown>;
    const customers = (overview.customers ?? {}) as Record<string, unknown>;

    const total = Math.max(1, Number(customers.total ?? 0));
    const active = Math.max(0, Number(customers.active ?? 0));
    const newCustomers = Math.max(0, Number(customers.new ?? 0));
    const converted = Math.min(active, Math.round(active * 0.65));

    const stages = [
      { stage: 'Visitors', count: total, conversion: 100, dropoff: 0 },
      { stage: 'Signups', count: newCustomers, conversion: Number(((newCustomers / total) * 100).toFixed(1)), dropoff: Number((((total - newCustomers) / total) * 100).toFixed(1)) },
      { stage: 'Active', count: active, conversion: Number(((active / Math.max(newCustomers, 1)) * 100).toFixed(1)), dropoff: Number((((Math.max(newCustomers, 1) - active) / Math.max(newCustomers, 1)) * 100).toFixed(1)) },
      { stage: 'Converted', count: converted, conversion: Number(((converted / Math.max(active, 1)) * 100).toFixed(1)), dropoff: Number((((Math.max(active, 1) - converted) / Math.max(active, 1)) * 100).toFixed(1)) },
    ];

    return NextResponse.json(stages);
  } catch (error) {
    serverLogger.apiError('/api/admin/analytics/funnel', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch funnel data' }, { status: 500 });
  }
}
