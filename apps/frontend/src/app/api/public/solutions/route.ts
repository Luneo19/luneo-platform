import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { cacheService, cacheTTL } from '@/lib/cache/redis';

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

// Solutions data
const SOLUTIONS_DATA: Record<string, SolutionData> = {
  customizer: {
    id: 'customizer',
    name: 'Customizer 2D',
    tagline: 'Personnalisation produit en temps réel',
    description: 'Offrez à vos clients une expérience de personnalisation immersive avec notre éditeur 2D professionnel. Intégrable en quelques minutes sur votre site.',
    heroImage: '/solutions/customizer-hero.jpg',
    demoUrl: '/demo/customizer',
    features: [
      { title: 'Éditeur visuel drag & drop', description: 'Interface intuitive pour ajouter textes, images, formes', icon: 'Layers' },
      { title: 'Zones personnalisables', description: 'Définissez précisément les zones modifiables', icon: 'Target' },
      { title: 'Bibliothèque de cliparts', description: '10,000+ cliparts vectoriels inclus', icon: 'Image' },
      { title: 'Export haute résolution', description: 'PNG/PDF 300 DPI, CMYK print-ready', icon: 'Download' },
      { title: 'Règles métier', description: 'Contraintes de personnalisation configurables', icon: 'Settings' },
      { title: 'API & Webhooks', description: 'Intégration complète avec votre stack', icon: 'Code' },
    ],
    useCases: [
      { industry: 'Print-on-Demand', title: 'T-shirts personnalisés', description: 'Permettez aux clients de créer leurs propres designs', result: '+200% de panier moyen' },
      { industry: 'Packaging', title: 'Emballages sur mesure', description: 'Personnalisation de boîtes et sachets', result: '+150% de commandes' },
      { industry: 'Signalétique', title: 'Enseignes et panneaux', description: 'Création de supports visuels personnalisés', result: '-80% de temps de production' },
    ],
    testimonials: [
      { quote: 'Le customizer a révolutionné notre processus de vente. Les clients adorent créer leurs propres designs.', author: 'Marie B.', company: 'PrintShop Pro', role: 'CEO', avatar: 'MB', result: '+300% de conversions' },
    ],
    pricing: {
      starter: { price: 29, features: ['100 designs/mois', 'Export PNG', 'Support email'] },
      pro: { price: 79, features: ['1000 designs/mois', 'Export PDF/CMYK', 'API access', 'Support prioritaire'] },
      enterprise: { price: 'Sur devis', features: ['Illimité', 'White-label', 'SLA 99.99%', 'Account manager'] },
    },
    stats: [
      { value: '+200%', label: 'Panier moyen' },
      { value: '-60%', label: 'Temps de production' },
      { value: '95%', label: 'Satisfaction client' },
    ],
    integrations: ['Shopify', 'WooCommerce', 'Magento', 'PrestaShop', 'Printful'],
  },
  'configurator-3d': {
    id: 'configurator-3d',
    name: 'Configurateur 3D',
    tagline: 'Visualisation produit photoréaliste',
    description: 'Présentez vos produits en 3D avec une qualité studio. Rotation 360°, zoom HD, changement de couleurs et matériaux en temps réel.',
    heroImage: '/solutions/3d-hero.jpg',
    demoUrl: '/demo/3d-configurator',
    features: [
      { title: 'Rendu photoréaliste', description: 'Qualité comparable à une photo studio', icon: 'Camera' },
      { title: 'Rotation 360°', description: 'Visualisation sous tous les angles', icon: 'RotateCw' },
      { title: 'Changement de matériaux', description: 'Cuir, métal, bois, tissu en temps réel', icon: 'Palette' },
      { title: 'Annotations 3D', description: 'Points d\'info interactifs sur le modèle', icon: 'MessageCircle' },
      { title: 'Export AR (USDZ/GLB)', description: 'Visualisation en réalité augmentée', icon: 'Smartphone' },
      { title: 'Chargement optimisé', description: 'Modèles compressés, chargement < 3s', icon: 'Zap' },
    ],
    useCases: [
      { industry: 'Horlogerie', title: 'Montres de luxe', description: 'Configurez bracelets, cadrans, boîtiers', result: '+45% de conversions' },
      { industry: 'Mobilier', title: 'Canapés et meubles', description: 'Visualisez tissus et dimensions', result: '-50% de retours' },
      { industry: 'Automobile', title: 'Jantes et accessoires', description: 'Configurez les options sur votre véhicule', result: '+120% d\'engagement' },
    ],
    testimonials: [
      { quote: 'Nos clients passent 3x plus de temps sur les fiches produits depuis l\'intégration du configurateur 3D.', author: 'François D.', company: 'LuxWatch', role: 'E-commerce Director', avatar: 'FD', result: '+180% engagement' },
    ],
    pricing: {
      starter: { price: 49, features: ['5 modèles 3D', 'Rotation 360°', 'Support email'] },
      pro: { price: 149, features: ['50 modèles 3D', 'Export AR', 'Matériaux PBR', 'Analytics'] },
      enterprise: { price: 'Sur devis', features: ['Illimité', 'Modélisation incluse', 'CDN privé', 'SLA'] },
    },
    stats: [
      { value: '+45%', label: 'Conversions' },
      { value: '-50%', label: 'Retours produits' },
      { value: '3x', label: 'Temps sur page' },
    ],
    integrations: ['Shopify', 'WooCommerce', 'Magento', 'Custom JS'],
  },
  'virtual-try-on': {
    id: 'virtual-try-on',
    name: 'Virtual Try-On',
    tagline: 'Essayage virtuel avec IA',
    description: 'Permettez à vos clients d\'essayer lunettes, montres, bijoux virtuellement grâce à notre technologie de face et hand tracking.',
    heroImage: '/solutions/vto-hero.jpg',
    demoUrl: '/demo/virtual-try-on',
    features: [
      { title: 'Face tracking 468 points', description: 'Détection précise du visage en temps réel', icon: 'Scan' },
      { title: 'Hand tracking 21 points', description: 'Essayage de bagues et bracelets', icon: 'Hand' },
      { title: 'Capture photo/vidéo', description: 'Partage sur réseaux sociaux intégré', icon: 'Camera' },
      { title: 'Mode multi-produits', description: 'Essayez plusieurs articles simultanément', icon: 'Layers' },
      { title: 'Compatible mobile', description: 'Fonctionne sur iOS et Android', icon: 'Smartphone' },
      { title: 'Analytics détaillées', description: 'Suivi des essayages et conversions', icon: 'BarChart' },
    ],
    useCases: [
      { industry: 'Optique', title: 'Lunettes de vue', description: 'Essayage de montures en temps réel', result: '+40% conversions' },
      { industry: 'Bijouterie', title: 'Bagues et boucles', description: 'Visualisation sur soi avant achat', result: '-60% retours' },
      { industry: 'Horlogerie', title: 'Montres au poignet', description: 'Essayage virtuel de montres', result: '+25% panier' },
    ],
    testimonials: [
      { quote: 'Le virtual try-on a divisé nos retours par 2. Les clients savent exactement ce qu\'ils achètent.', author: 'Sophie L.', company: 'OptiStyle', role: 'Directrice E-commerce', avatar: 'SL', result: '-60% retours' },
    ],
    pricing: {
      starter: { price: 79, features: ['Face tracking', '1000 essayages/mois', 'Export photos'] },
      pro: { price: 199, features: ['Face + Hand tracking', '10K essayages/mois', 'Vidéo', 'Analytics'] },
      enterprise: { price: 'Sur devis', features: ['Illimité', 'SDK mobile natif', 'White-label', 'SLA'] },
    },
    stats: [
      { value: '+40%', label: 'Conversions' },
      { value: '-60%', label: 'Retours' },
      { value: '2M+', label: 'Essayages/mois' },
    ],
    integrations: ['Shopify', 'WooCommerce', 'iOS SDK', 'Android SDK'],
  },
};

/**
 * GET /api/public/solutions
 * Récupère les données d'une solution spécifique ou toutes les solutions
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
      logger.info('Solutions data served from cache', { solutionId });
      const response = NextResponse.json({ success: true, data: cached });
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    let data: SolutionData | SolutionData[] | null;

    if (solutionId) {
      data = SOLUTIONS_DATA[solutionId] || null;
      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Solution not found' },
          { status: 404 }
        );
      }
    } else {
      data = Object.values(SOLUTIONS_DATA);
    }

    // Mettre en cache
    await cacheService.set(cacheKey, data, { ttl: cacheTTL.publicMarketing });

    const response = NextResponse.json({ success: true, data });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    response.headers.set('X-Cache', 'MISS');
    return response;
  }, '/api/public/solutions', 'GET');
}

