import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

type DesignRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/designs/[id]
 * Récupère un design par son ID
 */
export async function GET(request: Request, { params }: DesignRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer le design
    const { data: design, error: dbError } = await supabase
      .from('designs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (dbError || !design) {
      logger.dbError('fetch design', dbError, {
        designId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
    }

    return { design };
  }, '/api/designs/[id]', 'GET');
}

/**
 * PUT /api/designs/[id]
 * Met à jour un design
 */
export async function PUT(request: Request, { params }: DesignRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Vérifier que le design existe et appartient à l'utilisateur
    const { data: existingDesign, error: checkError } = await supabase
      .from('designs')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingDesign) {
      logger.warn('Design update attempt on non-existent or unauthorized design', {
        designId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
    }

    // Préparer les données à mettre à jour
    const updateData: Record<string, any> = {};
    
    if (body.name !== undefined) updateData.name = body.name;
    if (body.prompt !== undefined) updateData.prompt = body.prompt;
    if (body.preview_url !== undefined) updateData.preview_url = body.preview_url;
    if (body.original_url !== undefined) updateData.original_url = body.original_url;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags : [];
    if (body.metadata !== undefined) {
      updateData.metadata = typeof body.metadata === 'object' ? body.metadata : {};
    }

    // Mettre à jour le design
    const { data: updatedDesign, error: updateError } = await supabase
      .from('designs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update design', updateError, {
        designId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour du design' };
    }

    logger.info('Design updated', {
      designId: id,
      userId: user.id,
    });

    return { design: updatedDesign };
  }, '/api/designs/[id]', 'PUT');
}

/**
 * DELETE /api/designs/[id]
 * Supprime un design
 */
export async function DELETE(request: Request, { params }: DesignRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que le design existe et appartient à l'utilisateur
    const { data: existingDesign, error: checkError } = await supabase
      .from('designs')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingDesign) {
      logger.warn('Design delete attempt on non-existent or unauthorized design', {
        designId: id,
        userId: user.id,
      });
      throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
    }

    // Supprimer le design
    const { error: deleteError } = await supabase
      .from('designs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      logger.dbError('delete design', deleteError, {
        designId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression du design' };
    }

    logger.info('Design deleted', {
      designId: id,
      userId: user.id,
    });

    return { success: true };
  }, '/api/designs/[id]', 'DELETE');
}

