/**
 * ★★★ META ADS INSIGHTS API ★★★
 * Forwards to NestJS backend.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { serverLogger } from '@/lib/logger-server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function forwardHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = { Cookie: request.headers.get('cookie') || '' };
  const auth = request.headers.get('authorization');
  if (auth) (headers as Record<string, string>)['Authorization'] = auth;
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const url = new URL(`${API_URL}/api/v1/admin/ads/meta/insights`);
    searchParams.forEach((v, k) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { headers: forwardHeaders(request) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(data.error ?? { error: 'Failed to fetch insights' }, { status: res.status });
    }
    return NextResponse.json(data);
  } catch (error) {
    serverLogger.apiError('/api/admin/ads/meta/insights', 'GET', error, 500);
    return NextResponse.json({ error: 'Failed to fetch insights' }, { status: 500 });
  }
}
