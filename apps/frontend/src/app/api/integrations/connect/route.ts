import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder, validateRequest, validateWithZodSchema } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { connectIntegrationSchema } from '@/lib/validation/zod-schemas';

/**
 * POST /api/integrations/connect
 * Connecte une intégration tierce
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const body = await request.json();

    // Validation avec Zod
    const validation = validateWithZodSchema(connectIntegrationSchema, body);
    if (!validation.valid) {
      throw {
        status: 400,
        message: `Erreurs de validation: ${validation.errors.join('; ')}`,
        code: 'VALIDATION_ERROR',
        metadata: { errors: validation.errors },
      };
    }

    const validatedData = validation.data as {
      service: 'shopify' | 'woocommerce' | 'stripe' | 'sendgrid' | 'cloudinary';
      credentials: Record<string, any>;
      config?: Record<string, any>;
    };
    const { service, credentials, config } = validatedData;

    // Vérifier si l'intégration existe déjà
    const { data: existingIntegration, error: checkError } = await supabase
      .from('integrations')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('service', service)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      logger.dbError('check existing integration', checkError, {
        userId: user.id,
        service,
      });
      throw { status: 500, message: 'Erreur lors de la vérification de l\'intégration' };
    }

    let integration;

    if (existingIntegration) {
      // Mettre à jour l'intégration existante
      const { data: updated, error: updateError } = await supabase
        .from('integrations')
        .update({
          credentials: credentials,
          config: config || {},
          status: 'connected',
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingIntegration.id)
        .select()
        .single();

      if (updateError) {
        logger.dbError('update integration', updateError, {
          userId: user.id,
          service,
          integrationId: existingIntegration.id,
        });
        throw { status: 500, message: 'Erreur lors de la mise à jour de l\'intégration' };
      }

      integration = updated;
    } else {
      // Créer une nouvelle intégration
      const { data: created, error: createError } = await supabase
        .from('integrations')
        .insert({
          user_id: user.id,
          service: service,
          credentials: credentials,
          config: config || {},
          status: 'connected',
          connected_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        logger.dbError('create integration', createError, {
          userId: user.id,
          service,
        });
        throw { status: 500, message: 'Erreur lors de la création de l\'intégration' };
      }

      integration = created;
    }

    logger.info('Integration connected', {
      userId: user.id,
      service,
      integrationId: integration.id,
    });

    return {
      integration: {
        ...integration,
        credentials: undefined, // Ne pas exposer les credentials
      },
      message: `Intégration ${service} connectée avec succès`,
    };
  }, '/api/integrations/connect', 'POST');
}

/**
 * DELETE /api/integrations/connect?service=xxx
 * Déconnecte une intégration
 */
export async function DELETE(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service');

    if (!service) {
      throw {
        status: 400,
        message: 'Le paramètre service est requis',
        code: 'VALIDATION_ERROR',
      };
    }

    // Vérifier que l'intégration existe
    const { data: existingIntegration, error: checkError } = await supabase
      .from('integrations')
      .select('id, service')
      .eq('user_id', user.id)
      .eq('service', service)
      .single();

    if (checkError || !existingIntegration) {
      if (checkError?.code === 'PGRST116') {
        throw { status: 404, message: 'Intégration non trouvée', code: 'INTEGRATION_NOT_FOUND' };
      }
      logger.dbError('fetch integration for deletion', checkError, {
        userId: user.id,
        service,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de l\'intégration' };
    }

    // Mettre à jour le statut de l'intégration
    const { error: updateError } = await supabase
      .from('integrations')
      .update({
        status: 'disconnected',
        disconnected_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingIntegration.id);

    if (updateError) {
      logger.dbError('disconnect integration', updateError, {
        userId: user.id,
        service,
        integrationId: existingIntegration.id,
      });
      throw { status: 500, message: 'Erreur lors de la déconnexion de l\'intégration' };
    }

    logger.info('Integration disconnected', {
      userId: user.id,
      service,
      integrationId: existingIntegration.id,
    });

    return { message: `Intégration ${service} déconnectée avec succès` };
  }, '/api/integrations/connect', 'DELETE');
}
