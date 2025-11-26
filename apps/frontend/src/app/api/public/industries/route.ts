import { NextRequest, NextResponse } from 'next/server';
import { ApiResponseBuilder } from '@/lib/api-response';
import { logger } from '@/lib/logger';
import { cacheService, cacheTTL } from '@/lib/cache/redis';

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

// Industries data
const INDUSTRIES_DATA: Record<string, IndustryData> = {
  fashion: {
    id: 'fashion',
    name: 'Mode & Textile',
    slug: 'fashion',
    tagline: 'Personnalisation textile à grande échelle',
    description: 'De la fast-fashion au luxe, Luneo accompagne les marques de mode dans leur transformation digitale avec des outils de personnalisation et de visualisation produit.',
    heroImage: '/industries/fashion-hero.jpg',
    icon: 'Shirt',
    features: [
      { title: 'Personnalisation textile', description: 'T-shirts, sweats, casquettes personnalisables', icon: 'Palette' },
      { title: 'Visualisation 3D vêtements', description: 'Rendu réaliste des tissus et coupes', icon: 'Box' },
      { title: 'Size guide AR', description: 'Guide des tailles en réalité augmentée', icon: 'Ruler' },
      { title: 'Print-ready automatique', description: 'Fichiers optimisés pour DTG, sérigraphie', icon: 'Printer' },
    ],
    caseStudies: [
      {
        company: 'FastStyle Co.',
        challenge: 'Gérer 500+ références personnalisables sans multiplier les SKUs',
        solution: 'Configurateur produit avec génération automatique des fichiers de production',
        results: ['+180% de références sans stock supplémentaire', '-70% de temps de mise en prod', '+40% de panier moyen'],
        quote: 'Luneo nous a permis de proposer la personnalisation sans complexifier notre logistique.',
        author: 'Julie M.',
        role: 'Head of E-commerce',
      },
    ],
    stats: [
      { value: '+180%', label: 'Références produits' },
      { value: '-70%', label: 'Temps de production' },
      { value: '+40%', label: 'Panier moyen' },
    ],
    recommendedSolutions: ['customizer', 'configurator-3d'],
  },
  furniture: {
    id: 'furniture',
    name: 'Mobilier & Décoration',
    slug: 'furniture',
    tagline: 'Visualisez vos meubles en situation',
    description: 'Le configurateur 3D et la réalité augmentée révolutionnent la vente de mobilier en permettant aux clients de visualiser les produits chez eux avant achat.',
    heroImage: '/industries/furniture-hero.jpg',
    icon: 'Sofa',
    features: [
      { title: 'Configurateur 3D interactif', description: 'Changez couleurs, tissus, dimensions', icon: 'Settings' },
      { title: 'AR Room Planner', description: 'Placez les meubles dans votre espace', icon: 'Smartphone' },
      { title: 'Rendu photoréaliste', description: 'Qualité studio photo sans shooting', icon: 'Camera' },
      { title: 'Vues 360° HDR', description: 'Rotation complète avec éclairage naturel', icon: 'RotateCw' },
    ],
    caseStudies: [
      {
        company: 'HomeDesign Plus',
        challenge: 'Réduire le taux de retour élevé (25%) sur les canapés',
        solution: 'Configurateur 3D avec AR pour visualiser le canapé dans le salon du client',
        results: ['-55% de retours', '+30% de conversions', '-€200K de coûts logistiques'],
        quote: 'Nos clients comprennent enfin les dimensions et proportions avant d\'acheter.',
        author: 'Marc D.',
        role: 'CEO',
      },
    ],
    stats: [
      { value: '-55%', label: 'Retours produits' },
      { value: '+30%', label: 'Conversions' },
      { value: '3x', label: 'Temps sur page' },
    ],
    recommendedSolutions: ['configurator-3d'],
  },
  jewelry: {
    id: 'jewelry',
    name: 'Bijouterie & Horlogerie',
    slug: 'jewelry',
    tagline: 'L\'essayage virtuel pour bijoux et montres',
    description: 'Virtual try-on et configurateur 3D permettent aux clients d\'essayer et personnaliser bijoux et montres de luxe sans se déplacer en boutique.',
    heroImage: '/industries/jewelry-hero.jpg',
    icon: 'Gem',
    features: [
      { title: 'Virtual Try-On bijoux', description: 'Essayage bagues, boucles, colliers', icon: 'Sparkles' },
      { title: 'Hand tracking précis', description: '21 points de tracking pour bagues', icon: 'Hand' },
      { title: 'Configurateur gravure', description: 'Personnalisation et gravure en temps réel', icon: 'PenTool' },
      { title: 'Rendu gemmes réaliste', description: 'Réfraction et brillance des pierres', icon: 'Diamond' },
    ],
    caseStudies: [
      {
        company: 'LuxJewels',
        challenge: 'Vendre des bagues de fiançailles en ligne sans essayage physique',
        solution: 'Virtual try-on avec hand tracking et configurateur de pierres',
        results: ['+65% de conversions', '-40% de retours', '+€150 de panier moyen'],
        quote: 'Le virtual try-on a ouvert un nouveau canal de vente pour nos bagues de luxe.',
        author: 'Caroline B.',
        role: 'Directrice Digital',
      },
    ],
    stats: [
      { value: '+65%', label: 'Conversions' },
      { value: '-40%', label: 'Retours' },
      { value: '+€150', label: 'Panier moyen' },
    ],
    recommendedSolutions: ['virtual-try-on', 'configurator-3d'],
  },
  automotive: {
    id: 'automotive',
    name: 'Automobile',
    slug: 'automotive',
    tagline: 'Configurez votre véhicule en 3D',
    description: 'Des jantes aux accessoires, en passant par la personnalisation intérieure, Luneo permet de visualiser toutes les options de votre véhicule.',
    heroImage: '/industries/automotive-hero.jpg',
    icon: 'Car',
    features: [
      { title: 'Configurateur véhicule', description: 'Couleurs, jantes, options en temps réel', icon: 'Settings' },
      { title: 'Rendu extérieur/intérieur', description: 'Visualisation complète du véhicule', icon: 'Camera' },
      { title: 'AR parking', description: 'Visualisez le véhicule devant chez vous', icon: 'Smartphone' },
      { title: 'Comparaison d\'options', description: 'Comparez les finitions côte à côte', icon: 'Columns' },
    ],
    caseStudies: [
      {
        company: 'AutoParts Premium',
        challenge: 'Permettre aux clients de visualiser les jantes sur leur véhicule',
        solution: 'Configurateur 3D avec bibliothèque de véhicules et jantes',
        results: ['+90% d\'engagement', '+35% de conversions', '-25% de demandes SAV'],
        quote: 'Les clients peuvent enfin voir le rendu final avant d\'acheter.',
        author: 'Philippe R.',
        role: 'Fondateur',
      },
    ],
    stats: [
      { value: '+90%', label: 'Engagement' },
      { value: '+35%', label: 'Conversions' },
      { value: '-25%', label: 'Demandes SAV' },
    ],
    recommendedSolutions: ['configurator-3d'],
  },
  sports: {
    id: 'sports',
    name: 'Sport & Outdoor',
    slug: 'sports',
    tagline: 'Équipements sportifs personnalisés',
    description: 'De la personnalisation de maillots aux équipements techniques, Luneo aide les marques de sport à offrir des expériences de personnalisation uniques.',
    heroImage: '/industries/sports-hero.jpg',
    icon: 'Dumbbell',
    features: [
      { title: 'Personnalisation maillots', description: 'Noms, numéros, logos d\'équipe', icon: 'Shirt' },
      { title: 'Configurateur équipement', description: 'Chaussures, raquettes, vélos', icon: 'Settings' },
      { title: 'Team builder', description: 'Création de tenues d\'équipe complètes', icon: 'Users' },
      { title: 'Export fichiers flocage', description: 'Fichiers optimisés pour flocage/broderie', icon: 'FileOutput' },
    ],
    caseStudies: [
      {
        company: 'TeamGear Pro',
        challenge: 'Gérer les commandes d\'équipes avec personnalisation individuelle',
        solution: 'Team builder avec gestion des tailles et personnalisation par joueur',
        results: ['+200% de commandes équipes', '-80% de temps de saisie', '+50% de panier moyen'],
        quote: 'Les coachs adorent notre outil. Ils configurent toute l\'équipe en 10 minutes.',
        author: 'Thomas L.',
        role: 'CEO',
      },
    ],
    stats: [
      { value: '+200%', label: 'Commandes équipes' },
      { value: '-80%', label: 'Temps de saisie' },
      { value: '+50%', label: 'Panier moyen' },
    ],
    recommendedSolutions: ['customizer'],
  },
  printing: {
    id: 'printing',
    name: 'Impression & Print-on-Demand',
    slug: 'printing',
    tagline: 'Production print-ready automatisée',
    description: 'Générez automatiquement des fichiers d\'impression optimisés pour tous vos produits personnalisés. DTG, sérigraphie, sublimation, découpe laser.',
    heroImage: '/industries/printing-hero.jpg',
    icon: 'Printer',
    features: [
      { title: 'Export multi-formats', description: 'PDF/X-4, TIFF, PNG 300 DPI', icon: 'FileOutput' },
      { title: 'Profils couleur ICC', description: 'CMYK, Pantone, profils custom', icon: 'Palette' },
      { title: 'Marques de coupe auto', description: 'Bleed, crop marks, zones sécurisées', icon: 'Scissors' },
      { title: 'Intégration POD', description: 'Printful, Printify, Gooten, Gelato', icon: 'Link' },
    ],
    caseStudies: [
      {
        company: 'PrintMaster Shop',
        challenge: 'Réduire les erreurs de fichiers et les reprises de production',
        solution: 'Workflow automatisé avec validation et export print-ready',
        results: ['-95% d\'erreurs fichiers', '-60% de temps de prépresse', '+30% de marge'],
        quote: 'Plus aucun fichier mal préparé ne passe en production.',
        author: 'Sarah K.',
        role: 'Responsable Production',
      },
    ],
    stats: [
      { value: '-95%', label: 'Erreurs fichiers' },
      { value: '-60%', label: 'Temps prépresse' },
      { value: '+30%', label: 'Marge' },
    ],
    recommendedSolutions: ['customizer'],
  },
};

/**
 * GET /api/public/industries
 * Récupère les données d'une industrie spécifique ou toutes les industries
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

    let data: IndustryData | IndustryData[] | null;

    if (industryId) {
      data = INDUSTRIES_DATA[industryId] || null;
      if (!data) {
        return NextResponse.json(
          { success: false, error: 'Industry not found' },
          { status: 404 }
        );
      }
    } else {
      data = Object.values(INDUSTRIES_DATA);
    }

    // Mettre en cache
    await cacheService.set(cacheKey, data, { ttl: cacheTTL.publicMarketing });

    const response = NextResponse.json({ success: true, data });
    response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=7200');
    response.headers.set('X-Cache', 'MISS');
    return response;
  }, '/api/public/industries', 'GET');
}

