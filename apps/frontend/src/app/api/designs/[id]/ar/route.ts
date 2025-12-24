import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

type DesignARRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/designs/[id]/ar
 * Récupère les informations AR pour un design
 */
export async function GET(request: Request, { params }: DesignARRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id: designId } = await params;
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer le design
    const { data: design, error: designError } = await supabase
      .from('designs')
      .select('id, user_id, preview_url, metadata, ar_model_url, ar_preview_url')
      .eq('id', designId)
      .single();

    if (designError || !design) {
      if (designError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch design for AR', designError, {
        designId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    // Vérifier les permissions (propriétaire ou public)
    if (design.user_id !== user.id && !design.metadata?.is_public) {
      logger.warn('Unauthorized AR access attempt', {
        designId,
        userId: user.id,
        designOwnerId: design.user_id,
      });
      throw { status: 403, message: 'Accès refusé', code: 'FORBIDDEN' };
    }

    return {
      designId: design.id,
      arModelUrl: design.ar_model_url,
      arPreviewUrl: design.ar_preview_url,
      previewUrl: design.preview_url,
      metadata: design.metadata || {},
    };
  }, '/api/designs/[id]/ar', 'GET');
}
