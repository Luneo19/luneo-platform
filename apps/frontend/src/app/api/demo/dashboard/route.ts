import { NextResponse } from 'next/server';

/**
 * Demo mode is disabled in production.
 * This endpoint always returns 404.
 */
export async function GET() {
  return NextResponse.json({ error: 'Demo mode is disabled' }, { status: 404 });
}

