import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { cacheService, cacheTTL } from '@/lib/cache/redis';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Types
interface IndustryFeature {
  title: string;
  description: string;
  icon: string;
}

interface IndustryCaseStudy {
  company: string;
  logo?: string;
  challenge: string;
  solution: string;
  results: string[];
  quote?: string;
  author?: string;
  role?: string;
}

interface IndustryData {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  heroImage: string;
  icon: string;
  features: IndustryFeature[];
  caseStudies: IndustryCaseStudy[];
  stats: Array<{ value: string; label: string }>;
  recommendedSolutions: string[];
}

// Fallback industries data
const FALLBACK_INDUSTRIES: Record<string, IndustryData> = {
  fashion: {
    id: 'fashion',
    name: 'Mode & Textile',
    slug: 'fashion',
    tagline: 'Personnalisation textile à grande échelle',
    description: 'De la fast-fashion au luxe, Luneo accompagne les marques de mode.',
    heroImage: '/industries/fashion-hero.jpg',
    icon: 'Shirt',
    features: [
      { title: 'Personnalisation textile', description: 'T-shirts, sweats, casquettes', icon: 'Palette' },
      { title: 'Visualisation 3D', description: 'Rendu réaliste des tissus', icon: 'Box' },
    ],
    caseStudies: [],
    stats: [{ value: '+180%', label: 'Références' }, { value: '-70%', label: 'Temps prod' }],
    recommendedSolutions: ['customizer', 'configurator-3d'],
  },
  furniture: {
    id: 'furniture',
    name: 'Mobilier & Décoration',
    slug: 'furniture',
    tagline: 'Visualisez vos meubles en situation',
    description: 'Le configurateur 3D révolutionne la vente de mobilier.',
    heroImage: '/industries/furniture-hero.jpg',
    icon: 'Sofa',
    features: [
      { title: 'Configurateur 3D', description: 'Changez couleurs, tissus, dimensions', icon: 'Settings' },
      { title: 'AR Room Planner', description: 'Placez les meubles dans votre espace', icon: 'Smartphone' },
    ],
    caseStudies: [],
    stats: [{ value: '-55%', label: 'Retours' }, { value: '+30%', label: 'Conversions' }],
    recommendedSolutions: ['configurator-3d'],
  },
  jewelry: {
    id: 'jewelry',
    name: 'Bijouterie & Horlogerie',
    slug: 'jewelry',
    tagline: 'L\'essayage virtuel pour bijoux et montres',
    description: 'Virtual try-on et configurateur 3D pour bijoux et montres.',
    heroImage: '/industries/jewelry-hero.jpg',
    icon: 'Gem',
    features: [
      { title: 'Virtual Try-On bijoux', description: 'Essayage bagues, boucles, colliers', icon: 'Sparkles' },
      { title: 'Hand tracking', description: '21 points de tracking pour bagues', icon: 'Hand' },
    ],
    caseStudies: [],
    stats: [{ value: '+65%', label: 'Conversions' }, { value: '-40%', label: 'Retours' }],
    recommendedSolutions: ['virtual-try-on', 'configurator-3d'],
  },
};

/**
 * GET /api/public/industries
 * Récupère les données d'une industrie depuis le backend API avec fallback
 */
export async function GET(request: NextRequest) {
  return ApiResponseBuilder.handle(async () => {
    const { searchParams } = new URL(request.url);
    const industryId = searchParams.get('id');

    const cacheKey = industryId 
      ? `public:industries:${industryId}` 
      : 'public:industries:all';

    // Vérifier le cache
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      logger.info('Industries data served from cache', { industryId });
      const response = NextResponse.json({ success: true, data: cached });
      response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
      response.headers.set('X-Cache', 'HIT');
      return response;
    }

    let data: IndustryData | IndustryData[] | null = null;

    try {
      // Forward to backend API (public route, no auth required)
      const url = new URL(`${API_URL}/api/v1/public/industries`);
      if (industryId) url.searchParams.set('id', industryId);

      const backendResponse = await fetch(url.toString());

      if (!backendResponse.ok) {
        logger.error('Error fetching industries from backend', { error: backendResponse.status, industryId });
      } else {
        const result = await backendResponse.json();
        data = result.data || null;
      }
    } catch (error) {
      logger.error('Error fetching industries from backend', { error, industryId });
    }

    // Fallback aux données statiques si le backend échoue
    if (!data) {
      if (industryId) {
        data = FALLBACK_INDUSTRIES[industryId] || null;
        if (!data) {
          return NextResponse.json(
            { success: false, error: 'Industry not found' },
            { status: 404 }
          );
        }
      } else {
        data = Object.values(FALLBACK_INDUSTRIES);
      }
      logger.info('Industries using fallback data', { industryId });
    }

    // Mettre en cache
    await cacheService.set(cacheKey, data, { ttl: cacheTTL.publicMarketing });

    const response = NextResponse.json({ success: true, data });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    response.headers.set('X-Cache', 'MISS');
    return response;
  }, '/api/public/industries', 'GET');
}
