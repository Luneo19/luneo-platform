import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { exportPrintSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/designs/export-print
 * Exporte un design pour l'impression (PDF haute résolution)
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(exportPrintSchema, request, async (validatedData) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { designId, format = 'pdf', quality = 'high', dimensions } = validatedData as {
      designId: string;
      format?: 'pdf' | 'png' | 'jpg' | 'svg';
      quality?: 'low' | 'medium' | 'high' | 'ultra';
      dimensions?: { width: number; height: number };
    };

    // Récupérer le design
    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('*')
      .eq('id', designId)
      .eq('user_id', user.id)
      .single();

    if (designError || !design) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch design for export', designError, {
        designId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    // Vérifier que le design a des données
    if (!design.image_url && !design.design_data) {
      throw {
        status: 400,
        message: 'Le design ne contient pas de données à exporter',
        code: 'VALIDATION_ERROR',
      };
    }

    // Appeler le service d'export d'impression (backend ou service externe)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    let exportResponse: Response;

    try {
      exportResponse = await fetch(`${backendUrl}/api/designs/export-print`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY || ''}`,
        },
        body: JSON.stringify({
          designId,
          designData: design.design_data,
          imageUrl: design.image_url,
          format,
          quality,
          dimensions: dimensions || {
            width: design.width || 1920,
            height: design.height || 1080,
          },
        }),
      });
    } catch (fetchError: any) {
      logger.error('Print export service fetch error', fetchError, {
        userId: user.id,
        designId,
        format,
      });
      throw {
        status: 500,
        message: 'Erreur lors de l\'export pour l\'impression',
        code: 'EXPORT_SERVICE_ERROR',
      };
    }

    if (!exportResponse.ok) {
      const errorText = await exportResponse.text();
      logger.error('Print export service error', new Error(errorText), {
        userId: user.id,
        designId,
        format,
        status: exportResponse.status,
      });
      throw {
        status: exportResponse.status,
        message: 'Erreur lors de l\'export pour l\'impression',
        code: 'EXPORT_SERVICE_ERROR',
      };
    }

    const exportData = await exportResponse.json();

    // Enregistrer l'export dans l'historique
    await supabase
      .from('design_exports')
      .insert({
        design_id: designId,
        user_id: user.id,
        format,
        quality,
        file_url: exportData.fileUrl,
        file_size: exportData.fileSize,
        dimensions: dimensions || {
          width: design.width || 1920,
          height: design.height || 1080,
        },
      })
      .catch((insertError: unknown) => {
        logger.warn('Failed to log design export', {
          userId: user.id,
          designId,
          error: insertError,
        });
      });

    logger.info('Design exported for print', {
      userId: user.id,
      designId,
      format,
      quality,
    });

    return ApiResponseBuilder.success({
      export: {
        fileUrl: exportData.fileUrl,
        fileSize: exportData.fileSize,
        format,
        quality,
        dimensions: dimensions || {
          width: design.width || 1920,
          height: design.height || 1080,
        },
      },
    }, 'Design exporté pour l\'impression avec succès');
  });
}
