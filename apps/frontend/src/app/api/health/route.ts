/**
 * ★★★ API ROUTE - HEALTH CHECK ★★★
 * Endpoint pour vérifier la santé de l'application
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthCheckService } from '@/lib/monitoring/health-check';
import { ApiResponseBuilder } from '@/lib/api-response';

export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const health = await healthCheckService.checkHealth();
    return ApiResponseBuilder.success(health);
  }, '/api/health', 'GET');
}
