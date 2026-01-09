import { NextRequest } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { forwardGet } from '@/lib/backend-forward';

/**
 * GET /api/integrations/list
 * Liste toutes les intégrations disponibles et leurs statuts pour l'utilisateur
 * Forward vers backend NestJS: GET /api/integrations
 * Note: Le backend retourne les intégrations générales (slack, zapier, webhook)
 * Pour les intégrations e-commerce (shopify, woocommerce), utiliser /api/ecommerce
 * TODO: Fusionner les résultats des deux endpoints ou créer un endpoint unifié
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    // Récupérer les intégrations générales du backend
    const integrationsResult = await forwardGet('/integrations', request);
    const generalIntegrations = (integrationsResult.data as any[]) || [];

    // Liste des intégrations disponibles (template)
    // Note: Les intégrations e-commerce sont gérées via /api/ecommerce
    const availableIntegrations = [
      {
        id: 'shopify',
        name: 'Shopify',
        category: 'ecommerce',
        logo: '🛍️',
        description: 'Synchronisez vos produits et commandes Shopify',
        isConnected: false,
        status: 'inactive' as const,
        backendRoute: '/ecommerce/shopify',
      },
      {
        id: 'woocommerce',
        name: 'WooCommerce',
        category: 'ecommerce',
        logo: '🛒',
        description: 'Intégration avec votre boutique WooCommerce',
        isConnected: false,
        status: 'inactive' as const,
        backendRoute: '/ecommerce/woocommerce',
      },
      {
        id: 'zapier',
        name: 'Zapier',
        category: 'other',
        logo: '⚡',
        description: 'Automatisez vos workflows avec Zapier',
        isConnected: generalIntegrations.some(i => i.type === 'zapier'),
        status: generalIntegrations.find(i => i.type === 'zapier')?.isActive ? 'active' : 'inactive',
        backendRoute: '/integrations',
      },
      {
        id: 'slack',
        name: 'Slack',
        category: 'other',
        logo: '💬',
        description: 'Notifications Slack',
        isConnected: generalIntegrations.some(i => i.type === 'slack'),
        status: generalIntegrations.find(i => i.type === 'slack')?.isActive ? 'active' : 'inactive',
        backendRoute: '/integrations',
      },
      {
        id: 'webhook',
        name: 'Webhooks',
        category: 'other',
        logo: '🔗',
        description: 'Webhooks personnalisés',
        isConnected: generalIntegrations.some(i => i.type === 'webhook'),
        status: generalIntegrations.find(i => i.type === 'webhook')?.isActive ? 'active' : 'inactive',
        backendRoute: '/integrations',
      },
    ];

    return availableIntegrations;
  }, '/api/integrations/list', 'GET');
}
