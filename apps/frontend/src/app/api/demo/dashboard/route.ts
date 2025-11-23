import { NextResponse } from 'next/server';
import { demoDashboardData } from '@/data/demo/dashboard';

export async function GET(request: Request) {
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

