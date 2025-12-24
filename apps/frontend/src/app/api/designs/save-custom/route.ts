import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { saveCustomDesignSchema, updateCustomDesignSchema } from '@/lib/validation/zod-schemas';
import { z } from 'zod';

/**
 * POST /api/designs/save-custom
 * Sauvegarde un design personnalisé
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(saveCustomDesignSchema, request, async (validatedData) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { name, design_data, product_id, thumbnail_url, tags } = validatedData;

    // Créer le design personnalisé
    const { data: createdDesign, error: createError } = await supabase
      .from('custom_designs')
      .insert({
        user_id: user.id,
        name: name.trim(),
        design_data: design_data,
        product_id: product_id || null,
        thumbnail_url: thumbnail_url || null,
        tags: Array.isArray(tags) ? tags : [],
        status: 'draft',
      })
      .select()
      .single();

    if (createError) {
      logger.dbError('create custom design', createError, {
        userId: user.id,
        designName: name,
      });
      throw { status: 500, message: 'Erreur lors de la sauvegarde du design' };
    }

    logger.info('Custom design saved', {
      userId: user.id,
      designId: createdDesign.id,
      designName: name,
    });

    return ApiResponseBuilder.success(
      {
        design: createdDesign,
      },
      'Design personnalisé sauvegardé avec succès',
      201
    );
  });
}

/**
 * PUT /api/designs/save-custom?id=xxx
 * Met à jour un design personnalisé
 */
export async function PUT(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(updateCustomDesignSchema, request, async (validatedData) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const designId = searchParams.get('id');

    // Validation Zod pour le paramètre id
    const idValidation = z.string().uuid('ID de design invalide').safeParse(designId);

    if (!idValidation.success) {
      throw {
        status: 400,
        message: 'Le paramètre id est requis et doit être un UUID valide',
        code: 'VALIDATION_ERROR',
        details: idValidation.error.issues,
      };
    }

    const body = validatedData;

    // Vérifier que le design existe et appartient à l'utilisateur
    const { data: existingDesign, error: checkError } = await supabase
      .from('custom_designs')
      .select('id, name')
      .eq('id', idValidation.data)
      .eq('user_id', user.id)
      .single();

    if (checkError || !existingDesign) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Design non trouvé', code: 'DESIGN_NOT_FOUND' };
      }
      logger.dbError('fetch custom design for update', checkError, {
        designId: idValidation.data,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération du design' };
    }

    // Mettre à jour le design
    const { data: updatedDesign, error: updateError } = await supabase
      .from('custom_designs')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', idValidation.data)
      .eq('user_id', user.id)
      .select()
      .single();

    if (updateError) {
      logger.dbError('update custom design', updateError, {
        designId: idValidation.data,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la mise à jour du design' };
    }

    logger.info('Custom design updated', {
      designId: idValidation.data,
      userId: user.id,
    });

    return ApiResponseBuilder.success(
      {
        design: updatedDesign,
      },
      'Design personnalisé mis à jour avec succès'
    );
  });
}
