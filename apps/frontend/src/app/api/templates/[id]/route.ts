import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

type TemplateRouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * GET /api/templates/[id]
 * Récupère un template par ID
 */
export async function GET(request: NextRequest, { params }: TemplateRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const { data: template, error: templateError } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single();

    if (templateError || !template) {
      if (templateError?.code === 'PGRST116') {
        throw { status: 404, message: 'Template non trouvé', code: 'TEMPLATE_NOT_FOUND' };
      }
      logger.dbError('fetch template', templateError, { templateId: id });
      throw { status: 500, message: 'Erreur lors de la récupération du template' };
    }

    // Incrémenter usage_count (non bloquant)
    const { error: updateError } = await supabase
      .from('templates')
      .update({ usage_count: (template.usage_count || 0) + 1 })
      .eq('id', id);

    if (updateError) {
      logger.warn('Failed to increment template usage count', {
        templateId: id,
        error: updateError,
      });
    }

    logger.info('Template accessed', {
      templateId: id,
      usageCount: (template.usage_count || 0) + 1,
    });

    return { template };
  }, '/api/templates/[id]', 'GET');
}

/**
 * PATCH /api/templates/[id]
 * Met à jour un template
 */
export async function PATCH(request: NextRequest, { params }: TemplateRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Vérifier que le template existe et appartient à l'utilisateur (si applicable)
    const { data: existingTemplate, error: checkError } = await supabase
      .from('templates')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (checkError || !existingTemplate) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Template non trouvé', code: 'TEMPLATE_NOT_FOUND' };
      }
      logger.dbError('fetch template for update', checkError, { templateId: id, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du template' };
    }

    // Mettre à jour le template
    const { data: updatedTemplate, error: updateError } = await supabase
      .from('templates')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update template', updateError, {
        templateId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour du template' };
    }

    logger.info('Template updated', {
      templateId: id,
      userId: user.id,
    });

    return { template: updatedTemplate };
  }, '/api/templates/[id]', 'PATCH');
}

/**
 * DELETE /api/templates/[id]
 * Supprime un template
 */
export async function DELETE(request: NextRequest, { params }: TemplateRouteContext) {
  return ApiResponseBuilder.handle(async () => {
    const { id } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Vérifier que le template existe
    const { data: existingTemplate, error: checkError } = await supabase
      .from('templates')
      .select('id')
      .eq('id', id)
      .single();

    if (checkError || !existingTemplate) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Template non trouvé', code: 'TEMPLATE_NOT_FOUND' };
      }
      logger.dbError('fetch template for deletion', checkError, { templateId: id, userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération du template' };
    }

    // Supprimer le template
    const { error: deleteError } = await supabase.from('templates').delete().eq('id', id);

    if (deleteError) {
      logger.dbError('delete template', deleteError, {
        templateId: id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la suppression du template' };
    }

    logger.info('Template deleted', {
      templateId: id,
      userId: user.id,
    });

    return { message: 'Template supprimé avec succès' };
  }, '/api/templates/[id]', 'DELETE');
}
