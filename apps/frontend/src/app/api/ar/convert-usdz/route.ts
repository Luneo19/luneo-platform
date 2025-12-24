/**
 * API Route: GLB → USDZ Conversion
 * Convertit les modèles GLB en USDZ pour AR Quick Look iOS
 */

import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { createClient } from '@/lib/supabase/server';
import { convertUSDZSchema, idSchema, z } from '@/lib/validation/zod-schemas';

// Metrics helper - in production, send to backend metrics endpoint
async function recordARConversionMetric(
  conversionType: string,
  durationSeconds: number,
  success: boolean,
): Promise<void> {
  try {
    const metricsEndpoint = process.env.NEXT_PUBLIC_BACKEND_URL
      ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/metrics/ar-conversion`
      : '/api/metrics/ar-conversion';

    await fetch(metricsEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        conversionType,
        durationSeconds,
        success,
        timestamp: Date.now(),
      }),
    }).catch(() => {
      // Silently fail - metrics are non-critical
    });
  } catch {
    // Silently fail
  }
}

/**
 * POST /api/ar/convert-usdz
 * Convertit un modèle GLB en USDZ
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const startTime = Date.now();
    const supabase = await createClient();

    // Authenticate
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();
    
    // Validation Zod
    const validation = convertUSDZSchema.extend({
      ar_model_id: idSchema.optional(),
      product_name: z.string().max(200).optional(),
      scale: z.number().min(0.1).max(10).optional(),
    }).safeParse(body);
    
    if (!validation.success) {
      throw {
        status: 400,
        message: 'Paramètres invalides',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    const { glb_url, product_name, scale, ar_model_id, optimize = true } = validation.data;

    // Check if USDZ already exists in database
    if (ar_model_id) {
      const { data: existingModel, error: modelError } = await supabase
        .from('ar_models')
        .select('usdz_url')
        .eq('id', ar_model_id)
        .single();

      if (!modelError && existingModel?.usdz_url) {
        logger.info('USDZ already exists (cached)', {
          arModelId: ar_model_id,
          userId: user.id,
        });
        return {
          usdz_url: existingModel.usdz_url,
          file_size: 0,
          conversion_time: Date.now() - startTime,
          cached: true,
        };
      }
    }

    // Utiliser une API externe de conversion
    const conversionApiUrl =
      process.env.USDZ_CONVERSION_API_URL || 'https://api.luneo.app/ar/convert-usdz';

    let conversionResponse: Response;
    try {
      conversionResponse = await fetch(conversionApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.USDZ_CONVERSION_API_KEY || ''}`,
        },
        body: JSON.stringify({
          glb_url: glb_url,
          product_name: product_name || 'Product',
          scale: scale || 1.0,
          output_format: 'usdz',
          optimize: true,
        }),
      });
    } catch (fetchError: unknown) {
      const errorObj = fetchError instanceof Error ? fetchError : new Error(String(fetchError));
      logger.error('USDZ conversion API fetch error', errorObj, {
        userId: user.id,
        glbUrl: glb_url,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la connexion au service de conversion',
        code: 'CONVERSION_SERVICE_ERROR',
      };
    }

    if (!conversionResponse.ok) {
      const errorData = await conversionResponse.json().catch(() => ({}));
      logger.error('USDZ conversion API error', new Error(errorData.message || 'Conversion failed'), {
        userId: user.id,
        status: conversionResponse.status,
        glbUrl: glb_url,
      });
      throw {
        status: conversionResponse.status,
        message: errorData.message || `Erreur de conversion: ${conversionResponse.statusText}`,
        code: 'CONVERSION_ERROR',
      };
    }

    const conversionData = await conversionResponse.json();
    const usdzUrl = conversionData.usdz_url;
    const fileSize = conversionData.file_size || 0;

    // Update database if ar_model_id provided
    if (ar_model_id) {
      const { error: updateError } = await supabase
        .from('ar_models')
        .update({
          usdz_url: usdzUrl,
          metadata: {
            usdz_file_size: fileSize,
            usdz_generated_at: new Date().toISOString(),
          },
        })
        .eq('id', ar_model_id);

      if (updateError) {
        logger.dbError('update ar model with usdz url', updateError, {
          arModelId: ar_model_id,
          userId: user.id,
        });
      }
    }

    const conversionTime = Date.now() - startTime;
    const durationSeconds = conversionTime / 1000;

    // Record metrics
    await recordARConversionMetric('glb_to_usdz', durationSeconds, true);

    logger.info('USDZ conversion completed', {
      userId: user.id,
      arModelId: ar_model_id,
      conversionTime,
      fileSize,
    });

    return {
      usdz_url: usdzUrl,
      file_size: fileSize,
      conversion_time: conversionTime,
    };
  }, '/api/ar/convert-usdz', 'POST');
}

/**
 * GET /api/ar/convert-usdz?ar_model_id=xxx
 * Vérifie si USDZ existe déjà
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const arModelId = searchParams.get('ar_model_id');

    if (!arModelId) {
      throw {
        status: 400,
        message: 'Le paramètre ar_model_id est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    const { data: model, error: modelError } = await supabase
      .from('ar_models')
      .select('usdz_url, metadata')
      .eq('id', arModelId)
      .single();

    if (modelError) {
      if (modelError.code === 'PGRST116') {
        throw { status: 404, message: 'Modèle AR non trouvé', code: 'AR_MODEL_NOT_FOUND' };
      }
      logger.dbError('fetch ar model', modelError, { arModelId });
      throw { status: 500, message: 'Erreur lors de la récupération du modèle AR' };
    }

    if (model?.usdz_url) {
      return {
        exists: true,
        usdz_url: model.usdz_url,
      };
    }

    return {
      exists: false,
    };
  }, '/api/ar/convert-usdz', 'GET');
}
