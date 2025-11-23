import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { syncWooCommerceSchema } from '@/lib/validation/zod-schemas';
import { z } from 'zod';

/**
 * POST /api/integrations/woocommerce/sync
 * Synchronise les produits WooCommerce avec la plateforme
 */
export async function POST(request: NextRequest) {
  return ApiResponseBuilder.validateWithZod(syncWooCommerceSchema, request, async (validatedData) => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { integration_id, sync_type = 'products', force = false } = validatedData;

    // Vérifier que l'intégration existe et appartient à l'utilisateur
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integration_id)
      .eq('user_id', user.id)
      .eq('service', 'woocommerce')
      .single();

    if (integrationError || !integration) {
      if (integrationError?.code === 'PGRST116') {
        throw { status: 404, message: 'Intégration WooCommerce non trouvée', code: 'INTEGRATION_NOT_FOUND' };
      }
      logger.dbError('fetch WooCommerce integration for sync', integrationError, {
        integrationId: integration_id,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de l\'intégration' };
    }

    if (integration.status !== 'connected') {
      throw {
        status: 400,
        message: 'L\'intégration WooCommerce n\'est pas connectée',
        code: 'INTEGRATION_NOT_CONNECTED',
      };
    }

    // Appeler le service de synchronisation (backend)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';
    let syncResponse: Response;

    try {
      syncResponse = await fetch(`${backendUrl}/api/integrations/woocommerce/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY || ''}`,
        },
        body: JSON.stringify({
          integration_id: integration.id,
          store_url: integration.config?.store_url,
          credentials: integration.credentials,
          sync_type,
          force,
        }),
      });
    } catch (fetchError: any) {
      logger.error('WooCommerce sync service fetch error', fetchError, {
        userId: user.id,
        integrationId: integration.id,
        syncType: sync_type,
      });
      throw {
        status: 500,
        message: 'Erreur lors de la synchronisation WooCommerce',
        code: 'WOOCOMMERCE_SYNC_SERVICE_ERROR',
      };
    }

    if (!syncResponse.ok) {
      const errorText = await syncResponse.text();
      logger.error('WooCommerce sync service error', new Error(errorText), {
        userId: user.id,
        integrationId: integration.id,
        syncType: sync_type,
        status: syncResponse.status,
      });
      throw {
        status: syncResponse.status,
        message: 'Erreur lors de la synchronisation WooCommerce',
        code: 'WOOCOMMERCE_SYNC_SERVICE_ERROR',
      };
    }

    const syncData = await syncResponse.json();

    // Mettre à jour la date de dernière synchronisation
    await supabase
      .from('integrations')
      .update({
        last_sync: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', integration.id)
      .catch((updateError) => {
        logger.warn('Failed to update integration last_sync', {
          integrationId: integration.id,
          error: updateError,
        });
      });

    logger.info('WooCommerce sync completed', {
      userId: user.id,
      integrationId: integration.id,
      syncType: sync_type,
      itemsSynced: syncData.items_synced || 0,
    });

    return ApiResponseBuilder.success({
      sync: {
        type: sync_type,
        items_synced: syncData.items_synced || 0,
        status: 'completed',
        completed_at: new Date().toISOString(),
      },
    }, `Synchronisation ${sync_type} terminée avec succès`);
  });
}

/**
 * GET /api/integrations/woocommerce/sync?integration_id=xxx
 * Récupère l'historique de synchronisation
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('integration_id');

    // Validation Zod pour le paramètre integration_id
    const idValidation = z.string().uuid('ID d\'intégration invalide').safeParse(integrationId);

    if (!idValidation.success) {
      throw {
        status: 400,
        message: 'Le paramètre integration_id est requis et doit être un UUID valide',
        code: 'VALIDATION_ERROR',
        details: idValidation.error.issues,
      };
    }

    // Vérifier que l'intégration existe et appartient à l'utilisateur
    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('id')
      .eq('id', idValidation.data)
      .eq('user_id', user.id)
      .eq('service', 'woocommerce')
      .single();

    if (integrationError || !integration) {
      if (integrationError?.code === 'PGRST116') {
        throw { status: 404, message: 'Intégration WooCommerce non trouvée', code: 'INTEGRATION_NOT_FOUND' };
      }
      logger.dbError('fetch WooCommerce integration for sync history', integrationError, {
        integrationId: idValidation.data,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de l\'intégration' };
    }

    // Récupérer l'historique de synchronisation depuis audit_logs
    const { data: syncHistory, error: historyError } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', 'integration')
      .eq('resource_id', idValidation.data)
      .eq('action', 'woocommerce_sync')
      .order('created_at', { ascending: false })
      .limit(50);

    if (historyError) {
      logger.dbError('fetch WooCommerce sync history', historyError, {
        integrationId,
        userId: user.id,
      });
      throw { status: 500, message: 'Erreur lors de la récupération de l\'historique' };
    }

    logger.info('WooCommerce sync history fetched', {
      userId: user.id,
      integrationId: idValidation.data,
      historyCount: syncHistory?.length || 0,
    });

    return ApiResponseBuilder.success({
      integration_id: idValidation.data,
      history: syncHistory || [],
      total: syncHistory?.length || 0,
    });
  }, '/api/integrations/woocommerce/sync', 'GET');
}
