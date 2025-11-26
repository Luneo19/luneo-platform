import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { cacheService, cacheTTL } from '@/lib/cache/redis';

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

// Integrations data
const INTEGRATIONS_DATA: Record<string, IntegrationData> = {
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    slug: 'shopify',
    category: 'E-commerce',
    tagline: 'Intégration native pour Shopify',
    description: 'Connectez votre boutique Shopify en quelques clics. Synchronisation automatique des produits, commandes et clients.',
    logo: '/logos/shopify.svg',
    icon: 'ShoppingBag',
    website: 'https://shopify.com',
    docsUrl: '/docs/integrations/shopify',
    features: [
      { title: 'Sync automatique des produits', description: 'Vos produits Shopify sont automatiquement importés' },
      { title: 'Bouton "Personnaliser"', description: 'Ajout automatique sur vos fiches produits' },
      { title: 'Commandes synchronisées', description: 'Les commandes personnalisées sont envoyées à Shopify' },
      { title: 'Webhooks temps réel', description: 'Notifications instantanées des événements' },
      { title: 'Multi-devises', description: 'Support des devises multiples de Shopify' },
    ],
    setupSteps: [
      'Installez l\'app Luneo depuis le Shopify App Store',
      'Connectez votre compte Luneo',
      'Sélectionnez les produits à personnaliser',
      'Configurez les options de personnalisation',
      'Publiez et testez sur votre boutique',
    ],
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
    description: 'Plugin WordPress certifié pour intégrer Luneo à votre boutique WooCommerce.',
    logo: '/logos/woocommerce.svg',
    icon: 'ShoppingCart',
    website: 'https://woocommerce.com',
    docsUrl: '/docs/integrations/woocommerce',
    features: [
      { title: 'Installation en 1 clic', description: 'Plugin disponible sur le repository WordPress' },
      { title: 'Shortcodes flexibles', description: 'Intégrez le customizer n\'importe où sur votre site' },
      { title: 'Support des variations', description: 'Compatible avec les produits variables WooCommerce' },
      { title: 'REST API', description: 'Intégration complète avec l\'API WooCommerce' },
    ],
    setupSteps: [
      'Téléchargez le plugin depuis WordPress.org ou votre dashboard Luneo',
      'Activez le plugin dans WordPress',
      'Entrez votre clé API Luneo',
      'Configurez les produits personnalisables',
      'Testez l\'intégration',
    ],
    pricing: { free: false, includedIn: ['starter', 'pro', 'enterprise'] },
    status: 'available',
    popular: true,
  },
  printful: {
    id: 'printful',
    name: 'Printful',
    slug: 'printful',
    category: 'Print-on-Demand',
    tagline: 'Synchronisation automatique avec Printful',
    description: 'Envoyez automatiquement vos designs personnalisés vers Printful pour la production et l\'expédition.',
    logo: '/logos/printful.svg',
    icon: 'Printer',
    website: 'https://printful.com',
    docsUrl: '/docs/integrations/printful',
    features: [
      { title: 'Envoi automatique des fichiers', description: 'Les fichiers print-ready sont envoyés à Printful' },
      { title: 'Catalogue produits', description: 'Accédez au catalogue Printful depuis Luneo' },
      { title: 'Suivi de production', description: 'Suivez le statut de production en temps réel' },
      { title: 'Mockups synchronisés', description: 'Les mockups Printful sont disponibles dans Luneo' },
    ],
    setupSteps: [
      'Connectez votre compte Printful',
      'Sélectionnez les produits à synchroniser',
      'Configurez les zones d\'impression',
      'Activez l\'envoi automatique',
    ],
    pricing: { free: false, includedIn: ['pro', 'enterprise'] },
    status: 'available',
    popular: true,
  },
  stripe: {
    id: 'stripe',
    name: 'Stripe',
    slug: 'stripe',
    category: 'Paiement',
    tagline: 'Paiements sécurisés par Stripe',
    description: 'Acceptez les paiements directement dans votre configurateur avec Stripe Checkout.',
    logo: '/logos/stripe.svg',
    icon: 'CreditCard',
    website: 'https://stripe.com',
    docsUrl: '/docs/integrations/stripe',
    features: [
      { title: 'Checkout intégré', description: 'Paiement sans quitter le configurateur' },
      { title: 'Multi-devises', description: '135+ devises supportées' },
      { title: 'Abonnements', description: 'Gestion des abonnements récurrents' },
      { title: 'Webhooks', description: 'Notifications de paiement en temps réel' },
    ],
    setupSteps: [
      'Créez un compte Stripe ou connectez-vous',
      'Copiez vos clés API dans Luneo',
      'Configurez les webhooks',
      'Testez en mode sandbox',
      'Passez en production',
    ],
    pricing: { free: true, includedIn: ['starter', 'pro', 'enterprise'] },
    status: 'available',
    popular: true,
  },
  zapier: {
    id: 'zapier',
    name: 'Zapier',
    slug: 'zapier',
    category: 'Automation',
    tagline: 'Connectez Luneo à 5000+ applications',
    description: 'Automatisez vos workflows en connectant Luneo à des milliers d\'applications via Zapier.',
    logo: '/logos/zapier.svg',
    icon: 'Zap',
    website: 'https://zapier.com',
    docsUrl: '/docs/integrations/zapier',
    features: [
      { title: 'Triggers Luneo', description: 'Nouveau design, commande, etc.' },
      { title: 'Actions Luneo', description: 'Créer un design, exporter, etc.' },
      { title: '5000+ apps', description: 'Connectez à Slack, Gmail, Notion...' },
      { title: 'Zaps multi-étapes', description: 'Workflows complexes supportés' },
    ],
    setupSteps: [
      'Créez un compte Zapier',
      'Recherchez "Luneo" dans le catalogue',
      'Connectez votre compte Luneo',
      'Créez votre premier Zap',
    ],
    pricing: { free: false, includedIn: ['pro', 'enterprise'] },
    status: 'available',
    popular: false,
  },
  make: {
    id: 'make',
    name: 'Make (Integromat)',
    slug: 'make',
    category: 'Automation',
    tagline: 'Scénarios d\'automatisation avancés',
    description: 'Créez des scénarios d\'automatisation puissants avec Make (anciennement Integromat).',
    logo: '/logos/make.svg',
    icon: 'GitBranch',
    website: 'https://make.com',
    docsUrl: '/docs/integrations/make',
    features: [
      { title: 'Scénarios visuels', description: 'Interface drag & drop intuitive' },
      { title: 'Logique conditionnelle', description: 'Filtres et routeurs avancés' },
      { title: 'Transformations de données', description: 'Manipulation de données puissante' },
      { title: 'Historique d\'exécution', description: 'Logs détaillés de chaque exécution' },
    ],
    setupSteps: [
      'Créez un compte Make',
      'Ajoutez le module Luneo',
      'Connectez votre compte',
      'Construisez votre scénario',
    ],
    pricing: { free: false, includedIn: ['pro', 'enterprise'] },
    status: 'available',
    popular: false,
  },
  magento: {
    id: 'magento',
    name: 'Magento 2',
    slug: 'magento',
    category: 'E-commerce',
    tagline: 'Extension complète pour Magento 2',
    description: 'Extension Magento 2 pour une intégration complète de Luneo sur votre boutique.',
    logo: '/logos/magento.svg',
    icon: 'Store',
    website: 'https://magento.com',
    docsUrl: '/docs/integrations/magento',
    features: [
      { title: 'Installation Composer', description: 'Installation standard via Composer' },
      { title: 'Multi-stores', description: 'Support des configurations multi-boutiques' },
      { title: 'GraphQL API', description: 'Compatible avec le frontend GraphQL' },
      { title: 'B2B support', description: 'Fonctionnalités B2B de Magento supportées' },
    ],
    setupSteps: [
      'Installez l\'extension via Composer',
      'Configurez le module dans l\'admin',
      'Entrez vos credentials Luneo',
      'Assignez les produits personnalisables',
    ],
    pricing: { free: false, includedIn: ['pro', 'enterprise'] },
    status: 'available',
    popular: false,
  },
  prestashop: {
    id: 'prestashop',
    name: 'PrestaShop',
    slug: 'prestashop',
    category: 'E-commerce',
    tagline: 'Module certifié PrestaShop',
    description: 'Module officiel PrestaShop pour intégrer Luneo à votre boutique.',
    logo: '/logos/prestashop.svg',
    icon: 'ShoppingBag',
    website: 'https://prestashop.com',
    docsUrl: '/docs/integrations/prestashop',
    features: [
      { title: 'Installation depuis le back-office', description: 'Module disponible sur PrestaShop Addons' },
      { title: 'Multi-boutiques', description: 'Compatible avec PrestaShop Multi-shops' },
      { title: 'Hooks personnalisés', description: 'Placement flexible du customizer' },
      { title: 'Traductions', description: 'Support multilingue natif' },
    ],
    setupSteps: [
      'Téléchargez le module depuis PrestaShop Addons',
      'Installez via le gestionnaire de modules',
      'Configurez les paramètres API',
      'Activez sur les produits concernés',
    ],
    pricing: { free: false, includedIn: ['pro', 'enterprise'] },
    status: 'available',
    popular: false,
  },
};

/**
 * GET /api/public/integrations
 * Récupère les données d'une intégration spécifique ou toutes les intégrations
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

    let data: IntegrationData | IntegrationData[] | null;

    if (integrationId) {
      data = INTEGRATIONS_DATA[integrationId] || null;
      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Integration not found' },
          { status: 404 }
        );
      }
    } else {
      let integrations = Object.values(INTEGRATIONS_DATA);
      
      // Filtrer par catégorie si spécifié
      if (category) {
        integrations = integrations.filter(
          (int) => int.category.toLowerCase() === category.toLowerCase()
        );
      }
      
      data = integrations;
    }

    // Mettre en cache
    await cacheService.set(cacheKey, data, { ttl: cacheTTL.publicMarketing });

    const response = NextResponse.json({ success: true, data });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    response.headers.set('X-Cache', 'MISS');
    return response;
  }, '/api/public/integrations', 'GET');
}

