import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { cacheService, cacheTTL } from '@/lib/cache/redis';
import { createClient } from '@/lib/supabase/server';

// Types
interface IntegrationFeature {
  title: string;
  description: string;
}

interface IntegrationPricing {
  free: boolean;
  includedIn: string[];
}

interface IntegrationData {
  id: string;
  name: string;
  slug: string;
  category: string;
  tagline: string;
  description: string;
  logo: string;
  icon: string;
  website: string;
  docsUrl: string;
  features: IntegrationFeature[];
  setupSteps: string[];
  pricing: IntegrationPricing;
  status: 'available' | 'beta' | 'coming_soon';
  popular: boolean;
}

// Fallback integrations data
const FALLBACK_INTEGRATIONS: Record<string, IntegrationData> = {
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    slug: 'shopify',
    category: 'E-commerce',
    tagline: 'Intégration native pour Shopify',
    description: 'Connectez votre boutique Shopify en quelques clics.',
    logo: '/logos/shopify.svg',
    icon: 'ShoppingBag',
    website: 'https://shopify.com',
    docsUrl: '/docs/integrations/shopify',
    features: [
      { title: 'Sync automatique des produits', description: 'Vos produits sont automatiquement importés' },
      { title: 'Bouton "Personnaliser"', description: 'Ajout automatique sur vos fiches produits' },
    ],
    setupSteps: ['Installez l\'app Luneo', 'Connectez votre compte', 'Sélectionnez les produits'],
    pricing: { free: false, includedIn: ['starter', 'pro', 'enterprise'] },
    status: 'available',
    popular: true,
  },
  woocommerce: {
    id: 'woocommerce',
    name: 'WooCommerce',
    slug: 'woocommerce',
    category: 'E-commerce',
    tagline: 'Plugin officiel pour WordPress/WooCommerce',
    description: 'Plugin WordPress certifié pour intégrer Luneo.',
    logo: '/logos/woocommerce.svg',
    icon: 'ShoppingCart',
    website: 'https://woocommerce.com',
    docsUrl: '/docs/integrations/woocommerce',
    features: [
      { title: 'Installation en 1 clic', description: 'Plugin disponible sur WordPress.org' },
      { title: 'Shortcodes flexibles', description: 'Intégrez le customizer n\'importe où' },
    ],
    setupSteps: ['Téléchargez le plugin', 'Activez le plugin', 'Entrez votre clé API'],
    pricing: { free: false, includedIn: ['starter', 'pro', 'enterprise'] },
    status: 'available',
    popular: true,
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    slug: 'stripe',
    category: 'Paiement',
    tagline: 'Paiements sécurisés par Stripe',
    description: 'Acceptez les paiements directement dans votre configurateur.',
    logo: '/logos/stripe.svg',
    icon: 'CreditCard',
    website: 'https://stripe.com',
    docsUrl: '/docs/integrations/stripe',
    features: [
      { title: 'Checkout intégré', description: 'Paiement sans quitter le configurateur' },
      { title: 'Multi-devises', description: '135+ devises supportées' },
    ],
    setupSteps: ['Créez un compte Stripe', 'Copiez vos clés API', 'Configurez les webhooks'],
    pricing: { free: true, includedIn: ['starter', 'pro', 'enterprise'] },
    status: 'available',
    popular: true,
  },
};

/**
 * GET /api/public/integrations
 * Récupère les données d'une intégration depuis Supabase avec fallback
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('id');
    const category = searchParams.get('category');

    const cacheKey = integrationId 
      ? `public:integrations:${integrationId}`
      : category 
        ? `public:integrations:category:${category}`
        : 'public:integrations:all';

    // Vérifier le cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Integrations data served from cache', { integrationId, category });
      const response = NextResponse.json({ success: true, data: cached });
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    let data: IntegrationData | IntegrationData[] | null = null;

    try {
      const supabase = await createClient();

      if (integrationId) {
        // Récupérer une intégration spécifique
        const { data: integration, error } = await supabase
          .from('platform_integrations')
          .select('*')
          .eq('id', integrationId)
          .eq('is_published', true)
          .single();

        if (!error && integration) {
          data = {
            id: integration.id,
            name: integration.name,
            slug: integration.slug,
            category: integration.category,
            tagline: integration.tagline || '',
            description: integration.description,
            logo: integration.logo_url || `/logos/${integration.slug}.svg`,
            icon: integration.icon || 'Plug',
            website: integration.website || '',
            docsUrl: integration.docs_url || `/docs/integrations/${integration.slug}`,
            features: integration.features || [],
            setupSteps: integration.setup_steps || [],
            pricing: integration.pricing || { free: false, includedIn: [] },
            status: integration.status || 'available',
            popular: integration.is_popular || false,
          };
        }
      } else {
        // Récupérer toutes les intégrations
        let query = supabase
          .from('platform_integrations')
          .select('*')
          .eq('is_published', true)
          .order('display_order', { ascending: true });

        if (category) {
          query = query.ilike('category', category);
        }

        const { data: integrations, error } = await query;

        if (!error && integrations?.length) {
          data = integrations.map((integration: any) => ({
            id: integration.id,
            name: integration.name,
            slug: integration.slug,
            category: integration.category,
            tagline: integration.tagline || '',
            description: integration.description,
            logo: integration.logo_url || `/logos/${integration.slug}.svg`,
            icon: integration.icon || 'Plug',
            website: integration.website || '',
            docsUrl: integration.docs_url || `/docs/integrations/${integration.slug}`,
            features: integration.features || [],
            setupSteps: integration.setup_steps || [],
            pricing: integration.pricing || { free: false, includedIn: [] },
            status: integration.status || 'available',
            popular: integration.is_popular || false,
          }));
        }
      }
    } catch (error) {
      logger.error('Error fetching integrations from Supabase', { error, integrationId });
    }

    // Fallback aux données statiques si Supabase échoue
    if (!data) {
      if (integrationId) {
        data = FALLBACK_INTEGRATIONS[integrationId] || null;
        if (!data) {
          return NextResponse.json(
            { success: false, error: 'Integration not found' },
            { status: 404 }
          );
        }
      } else {
        let integrations = Object.values(FALLBACK_INTEGRATIONS);
        if (category) {
          integrations = integrations.filter(
            (int) => int.category.toLowerCase() === category.toLowerCase()
          );
        }
        data = integrations;
      }
      logger.info('Integrations using fallback data', { integrationId });
    }

    // Mettre en cache
    await cacheService.set(cacheKey, data, { ttl: cacheTTL.publicMarketing });

    const response = NextResponse.json({ success: true, data });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    response.headers.set('X-Cache', 'MISS');
    return response;
  }, '/api/public/integrations', 'GET');
}
