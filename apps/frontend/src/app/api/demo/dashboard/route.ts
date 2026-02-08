import { NextResponse } from 'next/server';
import { demoDashboardData } from '@/data/demo/dashboard';

/**
 * Demo dashboard data endpoint.
 * Only available in non-production environments.
 */
export async function GET(request: Request) {
  // Block demo endpoints in production
  if (process.env.NODE_ENV === 'production' && !process.env.ENABLE_DEMO_ROUTES) {
    return NextResponse.json(
      { error: 'Demo routes are disabled in production' },
      { status: 404 },
    );
  }

  const { searchParams } = new URL(request.url);
  const period = searchParams.get('period') || demoDashboardData.period;

  return NextResponse.json({
    success: true,
    data: {
      ...demoDashboardData,
      period,
    },
  });
}

