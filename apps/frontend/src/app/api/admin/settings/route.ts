/**
 * Admin Settings API - Forwards to NestJS backend /api/v1/admin/settings
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/admin/permissions';
import { serverLogger } from '@/lib/logger-server';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

function forwardHeaders(request: NextRequest): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
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

    const res = await fetch(`${API_URL}/api/v1/admin/settings`, {
      method: 'GET',
      headers: forwardHeaders(request),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    serverLogger.error('Failed to fetch admin settings', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    const res = await fetch(`${API_URL}/api/v1/admin/settings`, {
      method: 'PUT',
      headers: forwardHeaders(request),
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    serverLogger.error('Failed to update admin settings', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
