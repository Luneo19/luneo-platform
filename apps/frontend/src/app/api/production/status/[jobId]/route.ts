/**
 * ★★★ API ROUTE - STATUT PRODUCTION ★★★
 * API route pour vérifier le statut d'un job de production
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { productionService } from '@/lib/services/ProductionService';

// ========================================
// GET - Vérifie le statut
// ========================================

export async function GET(
  request: NextRequest,
  { params }: { params: { jobId: string } }
) {
  return ApiResponseBuilder.handle(async () => {
    const { jobId } = params;

    logger.info('Checking production status', { jobId });

    // Fetch job status from ProductionService (cache or queue)
    const { productionService } = await import('@/lib/services/ProductionService');
    const status = await productionService.checkStatus(jobId);

    if (!status) {
      return ApiResponseBuilder.notFound('Production job not found');
    }

    return ApiResponseBuilder.success({
      jobId: status.jobId,
      status: status.status,
      progress: status.progress,
      files: status.files || [],
      error: status.error,
    });
  }, '/api/production/status/[jobId]', 'GET');
}

