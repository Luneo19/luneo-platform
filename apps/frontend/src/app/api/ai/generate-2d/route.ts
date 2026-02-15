import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  try {
    const body = await req.json();
    
    // Create AbortController with 30-second timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
      const res = await fetch(`${API_BASE}/api/v1/ai/generate-2d`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      
      let raw: unknown;
      try {
        raw = await res.json();
      } catch (parseError) {
        return NextResponse.json(
          { error: 'Invalid JSON response from server' },
          { status: 500 }
        );
      }
      
      const data = (raw && typeof raw === 'object' && 'data' in raw) ? (raw as { data?: unknown }).data : raw;

      if (!res.ok) {
        return NextResponse.json(data || { error: 'Failed to generate image' }, { status: res.status });
      }

      return NextResponse.json(data);
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout after 30 seconds' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate image';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
