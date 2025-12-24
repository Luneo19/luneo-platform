import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { convert2DTo3DSchema } from '@/lib/validation/zod-schemas';
import { z } from 'zod';

/**
 * POST /api/ar/convert-2d-to-3d
 * Convertir une image 2D en modèle 3D via Meshy.ai
 * 
 * Note: Requiert MESHY_API_KEY dans les variables d'environnement
 * Obtenir une clé sur : https://www.meshy.ai/
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(convert2DTo3DSchema, request, async (validatedData) => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { design_id, image_url } = validatedData as { design_id: string; image_url: string };

    // Vérifier que le design appartient à l'utilisateur
    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('id, user_id, prompt')
      .eq('id', design_id)
      .single();

    if (designError || !design || design.user_id !== user.id) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      throw { status: 403, message: 'Accès refusé', code: 'FORBIDDEN' };
    }

    // Si Meshy API n'est pas configurée, retourner une erreur informative
    if (!process.env.MESHY_API_KEY) {
      throw {
        status: 501,
        message: 'Conversion 2D→3D non disponible',
        code: 'FEATURE_NOT_AVAILABLE',
        details: {
          message: 'Meshy.ai API non configurée. Contactez le support pour activer cette fonctionnalité.',
          documentation: 'https://docs.meshy.ai/api-image-to-3d',
        },
      };
    }

    // Étape 1: Initier la conversion avec Meshy.ai
    let meshyResponse: Response;
    try {
      meshyResponse = await fetch('https://api.meshy.ai/v2/image-to-3d', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image_url: image_url,
          enable_pbr: true, // Physically Based Rendering
          ai_model: 'meshy-4', // Latest model
        }),
      });
    } catch (fetchError: any) {
      logger.error('Meshy.ai API fetch error', fetchError, {
        userId: user.id,
        designId: design_id,
        imageUrl: image_url,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la connexion au service Meshy.ai',
        code: 'EXTERNAL_SERVICE_ERROR',
      };
    }

    if (!meshyResponse.ok) {
      const errorData = await meshyResponse.json().catch(() => ({}));
      logger.error('Meshy.ai API error', new Error(errorData.message || 'Conversion failed'), {
        userId: user.id,
        designId: design_id,
        status: meshyResponse.status,
        errorData,
      });
      throw {
        status: meshyResponse.status,
        message: errorData.message || `Erreur de conversion: ${meshyResponse.statusText}`,
        code: 'CONVERSION_ERROR',
      };
    }

    const meshyData = await meshyResponse.json();
    const taskId = meshyData.result;

    // Créer un AR model en statut "processing"
    const { data: arModel, error: arModelError } = await supabase
      .from('ar_models')
      .insert({
        user_id: user.id,
        design_id: design_id,
        name: `${design.prompt?.substring(0, 50) || 'Design'} - 3D`,
        description: 'Converti depuis design 2D avec Meshy.ai',
        model_url: '', // Sera mis à jour quand prêt
        format: 'glb',
        status: 'processing',
        metadata: {
          meshy_task_id: taskId,
          source: 'meshy_ai',
          conversion_started_at: new Date().toISOString(),
        },
      })
      .select()
      .single();

    if (arModelError) {
      logger.dbError('create ar model for 2d-to-3d conversion', arModelError, {
        userId: user.id,
        designId: design_id,
        taskId,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la création du modèle AR',
        code: 'DATABASE_ERROR',
      };
    }

    logger.info('2D to 3D conversion initiated', {
      userId: user.id,
      designId: design_id,
      arModelId: arModel.id,
      taskId,
    });

    // Retourner immédiatement (la conversion prend 2-5 minutes)
    // Un webhook ou polling vérifiera le statut et mettra à jour le modèle
    return ApiResponseBuilder.success({
      ar_model_id: arModel.id,
      task_id: taskId,
      status: 'processing',
      estimated_time: '2-5 minutes',
      message: 'Conversion en cours. Vous serez notifié quand le modèle 3D sera prêt.',
    });
  });
}

/**
 * GET /api/ar/convert-2d-to-3d?task_id=xxx
 * Vérifier le statut d'une conversion en cours
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('task_id');

    // Validation Zod pour le paramètre task_id
    const taskIdSchema = z.string().min(1, 'Le paramètre task_id est requis');
    const validation = taskIdSchema.safeParse(taskId);

    if (!validation.success) {
      throw {
        status: 400,
        message: 'Le paramètre task_id est requis',
        code: 'VALIDATION_ERROR',
        details: validation.error.issues,
      };
    }

    if (!process.env.MESHY_API_KEY) {
      throw {
        status: 501,
        message: 'Meshy.ai API non configurée',
        code: 'FEATURE_NOT_AVAILABLE',
      };
    }

    // Vérifier le statut sur Meshy.ai
    let statusResponse: Response;
    try {
      statusResponse = await fetch(`https://api.meshy.ai/v2/image-to-3d/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MESHY_API_KEY}`,
        },
      });
    } catch (fetchError: any) {
      logger.error('Meshy.ai status check fetch error', fetchError, {
        userId: user.id,
        taskId,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la vérification du statut',
        code: 'EXTERNAL_SERVICE_ERROR',
      };
    }

    if (!statusResponse.ok) {
      logger.error('Meshy.ai status check error', new Error(`HTTP ${statusResponse.status}`), {
        userId: user.id,
        taskId,
        status: statusResponse.status,
      });
      throw {
        status: statusResponse.status,
        message: 'Erreur lors de la vérification du statut de conversion',
        code: 'STATUS_CHECK_ERROR',
      };
    }

    const statusData = await statusResponse.json();

    // Si terminé, mettre à jour le AR model
    if (statusData.status === 'SUCCEEDED') {
      const { data: arModel, error: findError } = await supabase
        .from('ar_models')
        .select('id')
        .eq('metadata->>meshy_task_id', taskId)
        .single();

      if (arModel && !findError) {
        const { error: updateError } = await supabase
          .from('ar_models')
          .update({
            model_url: statusData.model_urls.glb,
            status: 'ready',
            metadata: {
              meshy_task_id: taskId,
              source: 'meshy_ai',
              conversion_completed_at: new Date().toISOString(),
            },
          })
          .eq('id', arModel.id);

        if (updateError) {
          logger.dbError('update ar model after conversion', updateError, {
            userId: user.id,
            arModelId: arModel.id,
            taskId,
          });
        } else {
          logger.info('2D to 3D conversion completed', {
            userId: user.id,
            arModelId: arModel.id,
            taskId,
            modelUrl: statusData.model_urls.glb,
          });
        }
      }
    }

    return ApiResponseBuilder.success({
      status: statusData.status,
      progress: statusData.progress,
      model_url: statusData.model_urls?.glb,
    });
  }, '/api/ar/convert-2d-to-3d', 'GET');
}
