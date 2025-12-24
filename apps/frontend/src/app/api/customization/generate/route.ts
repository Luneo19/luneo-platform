/**
 * ★★★ API ROUTE - GÉNÉRATION PERSONNALISATION ★★★
 * API route proxy vers le moteur IA Python
 * - POST: Lance la génération
 * - Gestion erreurs
 * - Retry logic
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { z } from 'zod';

// ========================================
// SCHEMA
// ========================================

const GenerateRequestSchema = z.object({
  productId: z.string().min(1),
  zoneId: z.string().min(1),
  prompt: z.string().min(1).max(500),
  font: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  size: z.number().int().positive().optional(),
  effect: z.enum(['normal', 'embossed', 'engraved', '3d']).optional(),
  zoneUV: z.object({
    u: z.array(z.number()).length(2),
    v: z.array(z.number()).length(2),
  }),
  modelUrl: z.string().url(),
});

// ========================================
// POST - Génère la personnalisation
// ========================================

export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const body = await request.json();

    // Validation
    const validated = GenerateRequestSchema.parse(body);

    logger.info('Generating customization', {
      productId: validated.productId,
      zoneId: validated.zoneId,
      promptLength: validated.prompt.length,
    });

    // Appel au moteur IA Python
    const aiEngineUrl = process.env.AI_ENGINE_URL || 'http://localhost:8000';

    try {
      const response = await fetch(`${aiEngineUrl}/api/generate/texture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: validated.prompt,
          font: validated.font || 'Arial',
          color: validated.color || '#000000',
          size: validated.size || 24,
          effect: validated.effect || 'engraved',
          zoneUV: validated.zoneUV,
          modelUrl: validated.modelUrl,
          productId: validated.productId,
          zoneId: validated.zoneId,
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI Engine error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      logger.info('Customization generated', {
        jobId: data.jobId,
        textureUrl: data.textureUrl,
      });

      return ApiResponseBuilder.success(data);
    } catch (error: any) {
      logger.error('Error calling AI engine', { error });

      // Retry logic (simple, peut être amélioré)
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new Error('La génération a pris trop de temps. Veuillez réessayer.');
      }

      throw new Error(`Erreur lors de la génération: ${error.message}`);
    }
  }, '/api/customization/generate', 'POST');
}
