/**
 * ★★★ API ROUTE - GÉNÉRATION FICHIERS PRODUCTION ★★★
 * API route pour générer les fichiers de production
 * - Export print-ready
 * - Export 3D
 * - Batch processing
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';
import { productionService } from '@/lib/services/ProductionService';

// ========================================
// SCHEMA
// ========================================

const GenerateProductionSchema = z.object({
  orderId: z.string().cuid(),
  items: z.array(
    z.object({
      id: z.string(),
      format: z.enum(['pdf', 'png', 'jpg', 'stl', 'obj', 'glb']),
      quality: z.enum(['standard', 'high', 'print-ready']).default('standard'),
    })
  ),
  options: z
    .object({
      cmyk: z.boolean().optional(),
      resolution: z.number().int().positive().optional(),
      colorProfile: z.string().optional(),
      bleed: z.number().optional(),
      cropMarks: z.boolean().optional(),
    })
    .optional(),
});

// ========================================
// POST - Génère les fichiers
// ========================================

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation
    const validated = GenerateProductionSchema.parse(body);

    logger.info('Generating production files', {
      orderId: validated.orderId,
      itemsCount: validated.items.length,
    });

    // Generate files
    const result = await productionService.generateBatch(
      validated.orderId,
      validated.items,
      validated.options
    );

    logger.info('Production files generation started', {
      orderId: validated.orderId,
      jobId: result.jobId,
    });

    return ApiResponseBuilder.success(result);
  }, '/api/orders/generate-production-files', 'POST');
}
