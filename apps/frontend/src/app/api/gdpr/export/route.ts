import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/gdpr/export
 * Exporte toutes les données utilisateur au format GDPR (JSON)
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    logger.info('GDPR export requested', {
      userId: user.id,
    });

    // Récupérer toutes les données utilisateur en parallèle
    const [
      profile,
      designs,
      orders,
      products,
      collections,
      integrations,
      apiKeys,
      notifications,
      teamMemberships,
    ] = await Promise.all([
      // Profil
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') {
            logger.dbError('fetch profile for GDPR export', error, { userId: user.id });
          }
          return data;
        }),

      // Designs
      supabase
        .from('designs')
        .select('id, prompt, created_at, updated_at, status, size')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch designs for GDPR export', error, { userId: user.id });
          }
          return data || [];
        }),

      // Commandes
      supabase
        .from('orders')
        .select('id, order_number, status, total_amount, created_at, updated_at')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch orders for GDPR export', error, { userId: user.id });
          }
          return data || [];
        }),

      // Produits
      supabase
        .from('products')
        .select('id, name, created_at, updated_at')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch products for GDPR export', error, { userId: user.id });
          }
          return data || [];
        }),

      // Collections
      supabase
        .from('design_collections')
        .select('id, name, description, created_at, updated_at')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch collections for GDPR export', error, { userId: user.id });
          }
          return data || [];
        }),

      // Intégrations
      supabase
        .from('integrations')
        .select('id, platform, platform_name, store_url, status, connected_at')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch integrations for GDPR export', error, { userId: user.id });
          }
          return data || [];
        }),

      // Clés API (sans les clés complètes)
      supabase
        .from('api_keys')
        .select('id, name, is_active, created_at, last_used_at')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch api keys for GDPR export', error, { userId: user.id });
          }
          return data || [];
        }),

      // Notifications
      supabase
        .from('notifications')
        .select('id, title, message, type, read, created_at')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch notifications for GDPR export', error, { userId: user.id });
          }
          return data || [];
        }),

      // Membres d'équipe
      supabase
        .from('team_members')
        .select('id, role, status, joined_at')
        .eq('user_id', user.id)
        .then(({ data, error }) => {
          if (error) {
            logger.dbError('fetch team memberships for GDPR export', error, { userId: user.id });
          }
          return data || [];
        }),
    ]);

    // Compiler toutes les données
    const exportData = {
      exportDate: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      profile: profile || null,
      designs: {
        count: designs.length,
        items: designs,
      },
      orders: {
        count: orders.length,
        items: orders,
      },
      products: {
        count: products.length,
        items: products,
      },
      collections: {
        count: collections.length,
        items: collections,
      },
      integrations: {
        count: integrations.length,
        items: integrations,
      },
      apiKeys: {
        count: apiKeys.length,
        items: apiKeys,
      },
      notifications: {
        count: notifications.length,
        items: notifications,
      },
      teamMemberships: {
        count: teamMemberships.length,
        items: teamMemberships,
      },
    };

    // Enregistrer la demande d'export GDPR
    const { error: insertError } = await supabase
      .from('gdpr_export_requests')
      .insert({
        user_id: user.id,
        exported_at: new Date().toISOString(),
        data_size: JSON.stringify(exportData).length,
      });

    if (insertError) {
      logger.warn('Failed to log GDPR export request', {
        userId: user.id,
        error: insertError,
      });
    }

    logger.info('GDPR export completed', {
      userId: user.id,
      dataSize: JSON.stringify(exportData).length,
    });

    return {
      data: exportData,
      format: 'json',
      message: 'Données exportées avec succès au format GDPR',
    };
  }, '/api/gdpr/export', 'GET');
}
