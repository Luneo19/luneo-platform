import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getBackendUrl } from '@/lib/api/server-url';

const API_BASE = getBackendUrl();

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get('accessToken')?.value;

  try {
    const res = await fetch(`${API_BASE}/api/v1/onboarding/progress`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const raw = await res.json();
    const data = raw.data ?? raw;

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ currentStep: 0, organization: null }, { status: 500 });
  }
}
