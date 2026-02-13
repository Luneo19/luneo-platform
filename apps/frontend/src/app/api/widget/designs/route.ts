import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';

export async function POST(request: NextRequest) {
  const backendUrl = getBackendUrl();

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
    const body = await request.text();
    const res = await fetch(`${backendUrl}/api/v1/widget/designs`, {
      method: 'POST',
      headers,
      body: body || undefined,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}
