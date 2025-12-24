import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';

/**
 * GET /api/integrations/list
 * Liste toutes les intégrations disponibles et leurs statuts pour l'utilisateur
 */
export async function GET() {
  return ApiResponseBuilder.handle(async () => {
    const supabase = await createClient();
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw { status: 401, message: 'Non authentifié', code: 'UNAUTHORIZED' };
    }

    // Récupérer les intégrations de l'utilisateur depuis la DB
    const { data: userIntegrations, error: dbError } = await supabase
      .from('integrations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (dbError) {
      logger.dbError('fetch integrations', dbError, { userId: user.id });
      throw { status: 500, message: 'Erreur lors de la récupération des intégrations' };
    }

    // Liste des intégrations disponibles (template)
    const availableIntegrations = [
      {
        id: 'shopify',
        name: 'Shopify',
        category: 'ecommerce',
        logo: '🛍️',
        description: 'Synchronisez vos produits et commandes Shopify',
        isConnected: false,
        status: 'inactive' as const,
      },
      {
        id: 'woocommerce',
        name: 'WooCommerce',
        category: 'ecommerce',
        logo: '🛒',
        description: 'Intégration avec votre boutique WooCommerce',
        isConnected: false,
        status: 'inactive' as const,
      },
      {
        id: 'stripe',
        name: 'Stripe',
        category: 'payment',
        logo: '💳',
        description: 'Gestion des paiements avec Stripe',
        isConnected: false,
        status: 'inactive' as const,
      },
      {
        id: 'sendgrid',
        name: 'SendGrid',
        category: 'email',
        logo: '📧',
        description: 'Envoi d\'emails transactionnels',
        isConnected: false,
        status: 'inactive' as const,
      },
      {
        id: 'zapier',
        name: 'Zapier',
        category: 'other',
        logo: '⚡',
        description: 'Automatisez vos workflows avec Zapier',
        isConnected: false,
        status: 'inactive' as const,
      },
      {
        id: 'make',
        name: 'Make',
        category: 'other',
        logo: '🔧',
        description: 'Automatisation avancée avec Make',
        isConnected: false,
        status: 'inactive' as const,
      },
      {
        id: 'printful',
        name: 'Printful',
        category: 'ecommerce',
        logo: '🖨️',
        description: 'Impression à la demande',
        isConnected: false,
        status: 'inactive' as const,
      },
    ];

    // Fusionner avec les intégrations de l'utilisateur
    const integrations = availableIntegrations.map(integration => {
      const userIntegration = userIntegrations?.find(
        ui => ui.name.toLowerCase() === integration.name.toLowerCase()
      );

      if (userIntegration) {
        return {
          ...integration,
          id: userIntegration.id,
          isConnected: true,
          status: userIntegration.status || 'active',
          lastSync: userIntegration.last_sync,
          config: userIntegration.config || {},
        };
      }

      return integration;
    });

    return integrations;
  }, '/api/integrations/list', 'GET');
}
