import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const backendUrl = getBackendUrl();

  // Forward API key from request headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization');
  if (apiKey) {
    if (apiKey.startsWith('Bearer ')) {
      headers['Authorization'] = apiKey;
    } else {
      headers['X-API-Key'] = apiKey;
    }
  }

  try {
    const res = await fetch(`${backendUrl}/api/v1/widget/products/${id}`, { headers });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}
