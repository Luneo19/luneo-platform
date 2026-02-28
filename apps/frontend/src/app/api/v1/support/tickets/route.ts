import { NextRequest, NextResponse } from 'next/server';
import { getBackendUrl } from '@/lib/api/server-url';
import { serverLogger } from '@/lib/logger-server';

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

async function resolveCurrentUser(request: NextRequest): Promise<{ email?: string; name?: string } | null> {
  const meResponse = await fetch(`${API_URL}/api/v1/auth/me`, {
    headers: forwardHeaders(request),
  });

  if (!meResponse.ok) {
    return null;
  }

  const raw = await meResponse.json().catch(() => null) as Record<string, unknown> | null;
  if (!raw || typeof raw !== 'object') return null;
  const data = (raw.data && typeof raw.data === 'object' ? raw.data : raw) as Record<string, unknown>;

  const firstName = typeof data.firstName === 'string' ? data.firstName.trim() : '';
  const lastName = typeof data.lastName === 'string' ? data.lastName.trim() : '';
  const fallbackName = [firstName, lastName].filter(Boolean).join(' ').trim();

  return {
    email: typeof data.email === 'string' ? data.email.trim() : undefined,
    name: fallbackName || (typeof data.name === 'string' ? data.name.trim() : undefined),
  };
}

export async function GET() {
  // Migration mode: keep endpoint stable for UI, return empty list.
  return NextResponse.json({
    tickets: [],
    migrationMode: true,
    message: 'Support ticketing is running in migration mode.',
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({})) as {
      subject?: string;
      description?: string;
      message?: string;
      category?: string;
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    };

    const subject = typeof body.subject === 'string' ? body.subject.trim() : '';
    const message = typeof body.description === 'string'
      ? body.description.trim()
      : (typeof body.message === 'string' ? body.message.trim() : '');

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 });
    }

    const user = await resolveCurrentUser(request);
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = {
      name: user.name || user.email.split('@')[0] || 'Luneo User',
      email: user.email,
      subject: `[Support] ${subject}`,
      message: `Category: ${body.category || 'general'}\nPriority: ${body.priority || 'medium'}\n\n${message}`,
      type: 'support',
    };

    const response = await fetch(`${API_URL}/api/v1/contact`, {
      method: 'POST',
      headers: forwardHeaders(request),
      body: JSON.stringify(payload),
    });

    const raw = await response.json().catch(() => ({})) as Record<string, unknown>;
    if (!response.ok) {
      return NextResponse.json(raw.error ?? raw ?? { error: 'Failed to create support ticket' }, { status: response.status });
    }

    const trackingId = typeof raw.trackingId === 'string'
      ? raw.trackingId
      : (typeof (raw.data as Record<string, unknown> | undefined)?.trackingId === 'string'
        ? String((raw.data as Record<string, unknown>).trackingId)
        : `ctc_${Date.now().toString(36)}`);

    return NextResponse.json({
      success: true,
      id: trackingId,
      ticketId: trackingId,
      ticket: {
        id: trackingId,
        subject,
        description: message,
        status: 'open',
        priority: body.priority || 'medium',
        category: body.category || 'technical',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        messages_count: 1,
      },
      trackingId,
      migrationMode: true,
    });
  } catch (error) {
    serverLogger.apiError('/api/v1/support/tickets', 'POST', error, 500);
    return NextResponse.json({ error: 'Failed to create support ticket' }, { status: 500 });
  }
}
