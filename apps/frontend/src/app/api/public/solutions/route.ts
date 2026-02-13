import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { serverLogger } from '@/lib/logger-server';
import { cacheService, cacheTTL } from '@/lib/cache/redis';
import { getBackendUrl } from '@/lib/api/server-url';

const API_URL = getBackendUrl();

// Types
interface SolutionFeature {
  title: string;
  description: string;
  icon: string;
}

interface SolutionUseCase {
  industry: string;
  title: string;
  description: string;
  result: string;
}

interface SolutionTestimonial {
  quote: string;
  author: string;
  company: string;
  role: string;
  avatar: string;
  result: string;
}

interface SolutionPricing {
  starter: { price: number; features: string[] };
  pro: { price: number; features: string[] };
  enterprise: { price: string; features: string[] };
}

interface SolutionData {
  id: string;
  name: string;
  tagline: string;
  description: string;
  heroImage: string;
  demoUrl?: string;
  features: SolutionFeature[];
  useCases: SolutionUseCase[];
  testimonials: SolutionTestimonial[];
  pricing: SolutionPricing;
  stats: Array<{ value: string; label: string }>;
  integrations: string[];
}

// Static CMS content for solutions pages (served when backend is unavailable)
const STATIC_SOLUTIONS: Record<string, SolutionData> = {
  customizer: {
    id: 'customizer',
    name: 'Customizer 2D',
    tagline: 'Personnalisation produit en temps réel',
    description: 'Offrez à vos clients une expérience de personnalisation immersive avec notre éditeur 2D professionnel.',
    heroImage: '/solutions/customizer-hero.jpg',
    demoUrl: '/demo/customizer',
    features: [
      { title: 'Éditeur visuel drag & drop', description: 'Interface intuitive pour ajouter textes, images, formes', icon: 'Layers' },
      { title: 'Zones personnalisables', description: 'Définissez précisément les zones modifiables', icon: 'Target' },
      { title: 'Bibliothèque de cliparts', description: '10,000+ cliparts vectoriels inclus', icon: 'Image' },
      { title: 'Export haute résolution', description: 'PNG/PDF 300 DPI, CMYK print-ready', icon: 'Download' },
    ],
    useCases: [
      { industry: 'Print-on-Demand', title: 'T-shirts personnalisés', description: 'Permettez aux clients de créer leurs propres designs', result: '+200% de panier moyen' },
    ],
    testimonials: [
      { quote: 'Le customizer a révolutionné notre processus de vente.', author: 'Marie B.', company: 'PrintShop Pro', role: 'CEO', avatar: 'MB', result: '+300% de conversions' },
    ],
    pricing: {
      starter: { price: 29, features: ['100 designs/mois', 'Export PNG', 'Support email'] },
      pro: { price: 79, features: ['1000 designs/mois', 'Export PDF/CMYK', 'API access'] },
      enterprise: { price: 'Sur devis', features: ['Illimité', 'White-label', 'SLA 99.99%'] },
    },
    stats: [{ value: '+200%', label: 'Panier moyen' }, { value: '-60%', label: 'Temps de production' }],
    integrations: ['Shopify', 'WooCommerce', 'Magento', 'PrestaShop', 'Printful'],
  },
  'configurator-3d': {
    id: 'configurator-3d',
    name: 'Configurateur 3D',
    tagline: 'Visualisation produit photoréaliste',
    description: 'Présentez vos produits en 3D avec une qualité studio.',
    heroImage: '/solutions/3d-hero.jpg',
    demoUrl: '/demo/3d-configurator',
    features: [
      { title: 'Rendu photoréaliste', description: 'Qualité comparable à une photo studio', icon: 'Camera' },
      { title: 'Rotation 360°', description: 'Visualisation sous tous les angles', icon: 'RotateCw' },
    ],
    useCases: [
      { industry: 'Horlogerie', title: 'Montres de luxe', description: 'Configurez bracelets, cadrans, boîtiers', result: '+45% de conversions' },
    ],
    testimonials: [
      { quote: 'Nos clients passent 3x plus de temps sur les fiches produits.', author: 'François D.', company: 'LuxWatch', role: 'E-commerce Director', avatar: 'FD', result: '+180% engagement' },
    ],
    pricing: {
      starter: { price: 49, features: ['5 modèles 3D', 'Rotation 360°'] },
      pro: { price: 149, features: ['50 modèles 3D', 'Export AR', 'Matériaux PBR'] },
      enterprise: { price: 'Sur devis', features: ['Illimité', 'Modélisation incluse'] },
    },
    stats: [{ value: '+45%', label: 'Conversions' }, { value: '-50%', label: 'Retours produits' }],
    integrations: ['Shopify', 'WooCommerce', 'Magento', 'Custom JS'],
  },
  'virtual-try-on': {
    id: 'virtual-try-on',
    name: 'Virtual Try-On',
    tagline: 'Essayage virtuel avec IA',
    description: 'Permettez à vos clients d\'essayer lunettes, montres, bijoux virtuellement.',
    heroImage: '/solutions/vto-hero.jpg',
    demoUrl: '/demo/virtual-try-on',
    features: [
      { title: 'Face tracking 468 points', description: 'Détection précise du visage', icon: 'Scan' },
      { title: 'Hand tracking 21 points', description: 'Essayage de bagues et bracelets', icon: 'Hand' },
    ],
    useCases: [
      { industry: 'Optique', title: 'Lunettes de vue', description: 'Essayage de montures en temps réel', result: '+40% conversions' },
    ],
    testimonials: [
      { quote: 'Le virtual try-on a divisé nos retours par 2.', author: 'Sophie L.', company: 'OptiStyle', role: 'Directrice E-commerce', avatar: 'SL', result: '-60% retours' },
    ],
    pricing: {
      starter: { price: 79, features: ['Face tracking', '1000 essayages/mois'] },
      pro: { price: 199, features: ['Face + Hand tracking', '10K essayages/mois'] },
      enterprise: { price: 'Sur devis', features: ['Illimité', 'SDK mobile natif'] },
    },
    stats: [{ value: '+40%', label: 'Conversions' }, { value: '-60%', label: 'Retours' }],
    integrations: ['Shopify', 'WooCommerce', 'iOS SDK', 'Android SDK'],
  },
};

/**
 * GET /api/public/solutions
 * Récupère les données d'une solution depuis le backend API avec fallback
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const solutionId = searchParams.get('id');

    const cacheKey = solutionId 
      ? `public:solutions:${solutionId}` 
      : 'public:solutions:all';

    // Vérifier le cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      serverLogger.info('Solutions data served from cache', { solutionId });
      const response = NextResponse.json({ success: true, data: cached });
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    let data: SolutionData | SolutionData[] | null = null;

    try {
      // Forward to backend API (public route, no auth required)
      const url = new URL(`${API_URL}/api/v1/public/solutions`);
      if (solutionId) url.searchParams.set('id', solutionId);

      const backendResponse = await fetch(url.toString());

      if (!backendResponse.ok) {
        serverLogger.error('Error fetching solutions from backend', { error: backendResponse.status, solutionId });
      } else {
        const result = await backendResponse.json();
        data = result.data || null;
      }
    } catch (error) {
      serverLogger.error('Error fetching solutions from backend', { error, solutionId });
    }

    // Fallback aux données statiques si le backend échoue
    if (!data) {
      if (solutionId) {
        data = STATIC_SOLUTIONS[solutionId] || null;
        if (!data) {
          return NextResponse.json(
            { success: false, error: 'Solution not found' },
            { status: 404 }
          );
        }
      } else {
        data = Object.values(STATIC_SOLUTIONS);
      }
      serverLogger.info('Solutions using static CMS content', { solutionId });
    }

    // Mettre en cache
    await cacheService.set(cacheKey, data, { ttl: cacheTTL.publicMarketing });

    const response = NextResponse.json({ success: true, data });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    response.headers.set('X-Cache', 'MISS');
    return response;
  }, '/api/public/solutions', 'GET');
}
