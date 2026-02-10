import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

/**
 * Proxy for design collections: GET (list) and POST (create).
 * Forwards to backend /api/v1/designs/collections with auth.
 */
export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const { searchParams } = new URL(req.url);

  const API_BASE = getBackendUrl();
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/designs/collections?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json(raw, { status: res.status });
    }
    return NextResponse.json(raw);
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch design collections' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;
  const API_BASE = getBackendUrl();

  try {
    const body = await req.json();
    const res = await fetch(`${API_BASE}/api/v1/designs/collections`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    const raw = await res.json();
    if (!res.ok) {
      return NextResponse.json(raw, { status: res.status });
    }
    return NextResponse.json(raw);
  } catch {
    return NextResponse.json(
      { error: 'Failed to create design collection' },
      { status: 500 }
    );
  }
}
