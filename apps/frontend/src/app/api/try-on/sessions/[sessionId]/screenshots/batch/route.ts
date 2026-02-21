import { NextRequest, NextResponse } from 'next/server';

import { getBackendUrl } from '@/lib/api/server-url';

const BACKEND_URL = getBackendUrl();

/**
 * Proxy endpoint for batch screenshot upload.
 * Forwards the request to the backend API.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    // Forward auth header if present
    const authHeader = request.headers.get('authorization');

    const response = await fetch(
      `${BACKEND_URL}/api/v1/try-on/sessions/${encodeURIComponent(sessionId)}/screenshots/batch`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authHeader && { Authorization: authHeader }),
        },
        body: JSON.stringify(body),
      },
    );

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to upload screenshots' },
      { status: 500 },
    );
  }
}
