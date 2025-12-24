/**
 * ★★★ API ROUTE - TRPC HEALTH CHECK ★★★
 * Endpoint de santé pour tRPC
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    return ApiResponseBuilder.success({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'trpc',
    });
  }, '/api/trpc/health', 'GET');
}

