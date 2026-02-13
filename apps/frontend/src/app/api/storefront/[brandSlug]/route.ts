/**
 * API Proxy: Storefront - Brand catalog
 * GET /api/storefront/[brandSlug] - Get brand info + products
 */
import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ brandSlug: string }> }
) {
  const { brandSlug } = await params;
  const searchParams = req.nextUrl.searchParams.toString();

  try {
    const url = `${API_BASE}/api/v1/products/brand/${brandSlug}${searchParams ? `?${searchParams}` : ''}`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      next: { revalidate: 60 }, // Cache for 1 minute
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.message || 'Brand not found' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data.data ?? data);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch storefront' }, { status: 500 });
  }
}
