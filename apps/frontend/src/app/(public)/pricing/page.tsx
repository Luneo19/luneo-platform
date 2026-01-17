'use client';

/**
 * 🎯 PRICING PAGE - LUNEO
 * 
 * Inspiré de Clerk.com/pricing
 * Design ultra professionnel avec tableau comparatif complet
 */

import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import {
  Check,
  X,
  Sparkles,
  Zap,
  Rocket,
  Building2,
  ChevronDown,
  Info,
  ArrowRight,
  Shield,
  Lock,
  Globe,
  Server,
  Users,
  Code,
  Palette,
  Box,
  Camera,
  Wand2,
  ShoppingCart,
  Package,
  FileText,
  BarChart3,
  Headphones,
  Mail,
  MessageCircle,
  Gift,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { usePricingPlans } from '@/lib/hooks/useMarketingData';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/lib/logger';
import { Loader2 } from 'lucide-react';

// ============================================
// TYPES
// ============================================

type PlanTier = 'starter' | 'professional' | 'business' | 'enterprise';

type FeatureCategory = 
  | 'platform'
  | 'customization'
  | 'ai'
  | '3d'
  | 'ar'
  | 'export'
  | 'integrations'
  | 'collaboration'
  | 'security'
  | 'support';

type Feature = {
  id: string;
  name: string;
  description?: string;
  category: FeatureCategory;
  starter: boolean | string;
  professional: boolean | string;
  business: boolean | string;
  enterprise: boolean | string;
};

type Plan = {
  id: PlanTier;
  name: string;
  description: string;
  priceMonthly: number | null;
  priceYearly: number | null;
  priceYearlyMonthly: number | null;
  currency: string;
  popular?: boolean;
  badge?: string;
  cta: string;
  ctaHref?: string;
  features: string[];
  limits: {
    designs: number | string;
    renders2D: number | string;
    renders3D: number | string;
    storage: string;
    teamMembers: number | string;
    apiCalls: number | string;
  };
};

// ============================================
// DATA
// ============================================

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour découvrir Luneo et créer vos premiers designs',
    priceMonthly: 0,
    priceYearly: 0,
    priceYearlyMonthly: 0,
    currency: 'EUR',
    cta: 'Commencer gratuitement',
    ctaHref: '/register',
    features: [
      '50 designs/mois',
      'Customizer 2D',
      '100 rendus 2D/mois',
      '10 rendus 3D/mois',
      'Export PNG/PDF',
      'Support email',
      '3 membres d\'équipe',
      '5 GB stockage',
    ],
    limits: {
      designs: 50,
      renders2D: 100,
      renders3D: 10,
      storage: '5 GB',
      teamMembers: 3,
      apiCalls: 10000,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Pour les créateurs et PME qui veulent passer à la vitesse supérieure',
    priceMonthly: 29,
    priceYearly: 278.40,
    priceYearlyMonthly: 23.20,
    currency: 'EUR',
    popular: true,
    badge: 'LE PLUS POPULAIRE',
    cta: 'Démarrer l\'essai gratuit',
    ctaHref: '/register?plan=professional',
    features: [
      '250 designs/mois',
      'Customizer 2D + 3D',
      '500 rendus 2D/mois',
      '50 rendus 3D/mois',
      'Virtual Try-On',
      'API access',
      'Support prioritaire',
      '10 membres d\'équipe',
      '50 GB stockage',
      'Branding personnalisé',
      'Webhooks temps réel',
    ],
    limits: {
      designs: 250,
      renders2D: 500,
      renders3D: 50,
      storage: '50 GB',
      teamMembers: 10,
      apiCalls: 100000,
    },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Pour les équipes qui ont besoin de collaboration et de volume',
    priceMonthly: 99,
    priceYearly: 950.40,
    priceYearlyMonthly: 79.20,
    currency: 'EUR',
    cta: 'Démarrer l\'essai gratuit',
    ctaHref: '/register?plan=business',
    features: [
      '1000 designs/mois',
      'Toutes les fonctionnalités Pro',
      '2000 rendus 2D/mois',
      '200 rendus 3D/mois',
      'White-label complet',
      'API & SDKs',
      'Support dédié',
      '50 membres d\'équipe',
      '100 GB stockage',
      'SLA 99.5%',
      'Analytics avancés',
    ],
    limits: {
      designs: 1000,
      renders2D: 2000,
      renders3D: 200,
      storage: '100 GB',
      teamMembers: 50,
      apiCalls: 200000,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solution sur-mesure pour les grandes organisations',
    priceMonthly: null, // Sur demande
    priceYearly: null, // Sur demande
    priceYearlyMonthly: null, // Sur demande
    currency: 'EUR',
    cta: 'Contacter les ventes',
    ctaHref: '/contact?type=enterprise',
    features: [
      'Designs illimités',
      'Rendus illimités',
      'Infrastructure dédiée',
      'White-label complet',
      'API illimitée',
      'SSO/SAML',
      'SLA 99.99%',
      'Support 24/7',
      'Account manager',
      'Formation équipe',
      'Intégrations custom',
    ],
    limits: {
      designs: 'Illimité',
      renders2D: 'Illimité',
      renders3D: 'Illimité',
      storage: 'Illimité',
      teamMembers: 'Illimité',
      apiCalls: 'Illimité',
    },
  },
];

const FEATURES: Feature[] = [
  // Platform pricing
  {
    id: 'base-price',
    name: 'Prix de base',
    category: 'platform',
    starter: '0€/mois',
    professional: '29€/mois',
    business: '99€/mois',
    enterprise: 'Sur demande',
  },
  {
    id: 'designs-monthly',
    name: 'Designs/mois',
    description: 'Nombre de designs personnalisés créés par mois',
    category: 'platform',
    starter: '50',
    professional: '250',
    business: '1000',
    enterprise: 'Illimité',
  },
  {
    id: 'renders-2d',
    name: 'Rendus 2D/mois',
    description: 'Nombre de rendus 2D haute qualité par mois',
    category: 'platform',
    starter: '100',
    professional: '500',
    business: '2000',
    enterprise: 'Illimité',
  },
  {
    id: 'renders-3d',
    name: 'Rendus 3D/mois',
    description: 'Nombre de rendus 3D par mois',
    category: 'platform',
    starter: '10',
    professional: '50',
    business: '200',
    enterprise: 'Illimité',
  },
  {
    id: 'storage',
    name: 'Stockage',
    description: 'Espace de stockage pour vos assets',
    category: 'platform',
    starter: '5 GB',
    professional: '50 GB',
    business: '100 GB',
    enterprise: 'Illimité',
  },
  {
    id: 'team-members',
    name: 'Membres d\'équipe',
    description: 'Nombre de membres pouvant accéder au compte',
    category: 'platform',
    starter: '3',
    professional: '10',
    business: '50',
    enterprise: 'Illimité',
  },
  
  // Customization features
  {
    id: 'customizer-2d',
    name: 'Customizer 2D',
    description: 'Éditeur visuel 2D pour personnaliser vos produits',
    category: 'customization',
    starter: true,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'configurator-3d',
    name: 'Configurateur 3D',
    description: 'Configurateur 3D interactif temps réel',
    category: '3d',
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'virtual-try-on',
    name: 'Virtual Try-On AR',
    description: 'Essayage virtuel AR pour lunettes, montres, bijoux',
    category: 'ar',
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'ai-generation',
    name: 'Génération IA',
    description: 'Génération de designs avec IA (DALL-E, Stable Diffusion)',
    category: 'ai',
    starter: '50/mois',
    professional: '500/mois',
    business: '2000/mois',
    enterprise: 'Illimité',
  },
  {
    id: 'export-formats',
    name: 'Formats d\'export',
    description: 'PNG, PDF, SVG, GLB, USDZ, Print-ready CMYK',
    category: 'export',
    starter: 'PNG, PDF',
    professional: 'Tous formats',
    business: 'Tous formats + HD',
    enterprise: 'Tous formats + Custom',
  },
  
  // Integrations
  {
    id: 'shopify',
    name: 'Intégration Shopify',
    description: 'Widget embed pour Shopify',
    category: 'integrations',
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'woocommerce',
    name: 'Intégration WooCommerce',
    description: 'Plugin WooCommerce',
    category: 'integrations',
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'api-access',
    name: 'Accès API',
    description: 'API REST complète pour intégrations custom',
    category: 'integrations',
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Webhooks temps réel pour synchronisation',
    category: 'integrations',
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  
  // Collaboration
  {
    id: 'real-time-collab',
    name: 'Collaboration temps réel',
    description: 'Édition collaborative en temps réel',
    category: 'collaboration',
    starter: false,
    professional: false,
    business: true,
    enterprise: true,
  },
  {
    id: 'white-label',
    name: 'White-label',
    description: 'Marque blanche complète',
    category: 'platform',
    starter: false,
    professional: false,
    business: true,
    enterprise: true,
  },
  
  // Security
  {
    id: 'sso',
    name: 'SSO/SAML',
    description: 'Single Sign-On avec SAML',
    category: 'security',
    starter: false,
    professional: false,
    business: false,
    enterprise: true,
  },
  {
    id: 'sla',
    name: 'SLA',
    description: 'Service Level Agreement',
    category: 'support',
    starter: false,
    professional: false,
    business: '99.5%',
    enterprise: '99.99%',
  },
  
  // Support
  {
    id: 'support',
    name: 'Support',
    description: 'Type de support disponible',
    category: 'support',
    starter: 'Email',
    professional: 'Prioritaire',
    business: 'Dédié',
    enterprise: '24/7 + Account Manager',
  },
];

const FAQS = [
  {
    question: 'Puis-je changer de plan à tout moment ?',
    answer: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont appliqués immédiatement et votre facturation est ajustée au prorata.',
  },
  {
    question: 'Que se passe-t-il si je dépasse mes limites ?',
    answer: 'Sur les plans Starter et Professional, vous recevrez une notification lorsque vous approchez de vos limites. Sur le plan Business, vous pouvez acheter des crédits supplémentaires. Sur Enterprise, les limites sont flexibles selon vos besoins.',
  },
  {
    question: 'Y a-t-il un essai gratuit ?',
    answer: 'Oui, le plan Starter est gratuit à vie avec 50 designs/mois. Les plans payants offrent un essai gratuit de 14 jours sans carte bancaire.',
  },
  {
    question: 'Les prix incluent-ils la TVA ?',
    answer: 'Les prix affichés sont hors taxes. La TVA sera ajoutée lors du paiement selon votre localisation (20% en France).',
  },
  {
    question: 'Puis-je exporter mes données ?',
    answer: 'Oui, vous pouvez exporter toutes vos données (designs, produits, configurations) à tout moment depuis les paramètres de votre compte.',
  },
  {
    question: 'Offrez-vous des remises pour les startups ?',
    answer: 'Oui, nous offrons des remises spéciales pour les startups éligibles (Y Combinator, Techstars, etc.). Contactez-nous pour plus d\'informations.',
  },
];

// ============================================
// COMPONENTS
// ============================================

function PlanCard({ plan, isYearly, onCheckout }: { plan: Plan; isYearly: boolean; onCheckout: (planId: string) => Promise<void> }) {
  const [isLoading, setIsLoading] = useState(false);
  const price = isYearly ? plan.priceYearlyMonthly : plan.priceMonthly;
  const displayPrice = price === null || price === undefined 
    ? 'Sur demande' 
    : price === 0 
    ? 'Gratuit' 
    : `${price}€`;
  const period = (price === null || price === undefined || price === 0) ? '' : '/mois';
  const yearlyNote = isYearly && price && price > 0 ? `Facturé ${plan.priceYearly}€/an` : null;

  const handleClick = async () => {
    // Si plan gratuit (Starter) ou Enterprise, rediriger vers register/contact
    if (plan.id === 'starter') {
      window.location.href = plan.ctaHref || '/register';
      return;
    }
    
    if (plan.id === 'enterprise') {
      window.location.href = plan.ctaHref || '/contact?type=enterprise';
      return;
    }

    // Pour les plans payants, créer la session Stripe Checkout
    setIsLoading(true);
    try {
      await onCheckout(plan.id);
    } catch (error: any) {
      logger.error('Erreur lors de la création de la session checkout', error);
      const errorMessage = error?.message || error?.error || 'Une erreur est survenue. Veuillez réessayer.';
      
      // Afficher un message d'erreur plus informatif
      if (errorMessage.includes('rate limit') || errorMessage.includes('max requests')) {
        alert('Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.');
      } else if (errorMessage.includes('Configuration') || errorMessage.includes('Stripe')) {
        alert('Erreur de configuration. Veuillez contacter le support.');
      } else {
        alert(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative rounded-2xl border-2 p-8 ${
        plan.popular
          ? 'border-blue-500 bg-gradient-to-b from-blue-50 to-white shadow-xl'
          : 'border-gray-200 bg-white'
      }`}
    >
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-blue-600 px-4 py-1 text-sm font-semibold text-white">
            {plan.badge}
          </span>
        </div>
      )}

      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
        <p className="mt-2 text-sm text-gray-600">{plan.description}</p>
      </div>

      <div className="mb-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold text-gray-900">{displayPrice}</span>
          {period && <span className="ml-2 text-lg text-gray-600">{period}</span>}
        </div>
        {yearlyNote && (
          <p className="mt-1 text-sm text-gray-500">{yearlyNote}</p>
        )}
        {isYearly && price !== null && price !== undefined && price > 0 && (
          <p className="mt-1 text-sm text-green-600 font-medium">
            Économisez 20% avec l'abonnement annuel
          </p>
        )}
      </div>

      <Button
        onClick={handleClick}
        disabled={isLoading}
        className={`w-full ${
          plan.popular
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-900 hover:bg-gray-800 text-white'
        }`}
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Chargement...
          </>
        ) : (
          plan.cta
        )}
      </Button>

      <ul className="mt-8 space-y-4">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-start">
            <Check className="mr-3 h-5 w-5 flex-shrink-0 text-green-500" />
            <span className="text-sm text-gray-700">{feature}</span>
          </li>
        ))}
      </ul>
    </motion>
  );
}

function FeatureTable({ features }: { features: Feature[] }) {
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | 'all'>('all');
  
  const categories: Array<{ id: FeatureCategory | 'all'; name: string }> = [
    { id: 'all', name: 'Toutes' },
    { id: 'platform', name: 'Plateforme' },
    { id: 'customization', name: 'Personnalisation' },
    { id: 'ai', name: 'IA' },
    { id: '3d', name: '3D' },
    { id: 'ar', name: 'AR' },
    { id: 'export', name: 'Export' },
    { id: 'integrations', name: 'Intégrations' },
    { id: 'collaboration', name: 'Collaboration' },
    { id: 'security', name: 'Sécurité' },
    { id: 'support', name: 'Support' },
  ];

  const filteredFeatures = selectedCategory === 'all'
    ? features
    : features.filter((f) => f.category === selectedCategory);

  return (
    <div className="overflow-x-auto">
      {/* Filtres par catégorie */}
      <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
              Fonctionnalité
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Starter</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
              Professional
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Business</th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
              Enterprise
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredFeatures.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                Aucune fonctionnalité dans cette catégorie
              </td>
            </tr>
          ) : (
            filteredFeatures.map((feature) => (
              <tr key={feature.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <span className="text-sm font-medium text-gray-900">{feature.name}</span>
                    {feature.description && (
                      <div className="group relative ml-2">
                        <Info className="h-4 w-4 text-gray-400 cursor-help" />
                        <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-2 bg-gray-900 text-white text-xs rounded shadow-lg z-10">
                          {feature.description}
                        </div>
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-center">
                  {typeof feature.starter === 'boolean' ? (
                    feature.starter ? (
                      <Check className="mx-auto h-5 w-5 text-green-500" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-gray-300" />
                    )
                  ) : (
                    <span className="text-sm text-gray-700 font-medium">{feature.starter}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {typeof feature.professional === 'boolean' ? (
                    feature.professional ? (
                      <Check className="mx-auto h-5 w-5 text-green-500" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-gray-300" />
                    )
                  ) : (
                    <span className="text-sm text-gray-700 font-medium">{feature.professional}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {typeof feature.business === 'boolean' ? (
                    feature.business ? (
                      <Check className="mx-auto h-5 w-5 text-green-500" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-gray-300" />
                    )
                  ) : (
                    <span className="text-sm text-gray-700 font-medium">{feature.business}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {typeof feature.enterprise === 'boolean' ? (
                    feature.enterprise ? (
                      <Check className="mx-auto h-5 w-5 text-green-500" />
                    ) : (
                      <X className="mx-auto h-5 w-5 text-gray-300" />
                    )
                  ) : (
                    <span className="text-sm text-gray-700 font-medium">{feature.enterprise}</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="text-lg font-semibold text-gray-900">{question}</span>
        <ChevronDown
          className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <p className="mt-4 text-gray-600">{answer}</p>
          </motion>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================
// MAIN COMPONENT
// ============================================

function PricingPageContent() {
  const [isYearly, setIsYearly] = useState(true);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(null);
  const { user } = useAuth();

  const { plans: apiPlans, loading, stripeEnabled } = usePricingPlans({
    interval: isYearly ? 'yearly' : 'monthly',
  });

  // Merge API plans with static plans
  const mergedPlans = useMemo(() => {
    if (!apiPlans || apiPlans.length === 0) {
      return PLANS;
    }

    return PLANS.map((staticPlan) => {
      const apiPlan = apiPlans.find((p: any) => p.id === staticPlan.id);
      if (apiPlan) {
      return {
        ...staticPlan,
        priceMonthly: apiPlan.price?.monthly ?? staticPlan.priceMonthly ?? null,
        priceYearly: apiPlan.price?.yearly ?? staticPlan.priceYearly ?? null,
        priceYearlyMonthly: apiPlan.price?.yearly 
          ? Math.round((apiPlan.price.yearly / 12) * 100) / 100 
          : staticPlan.priceYearlyMonthly ?? null,
      };
      }
      return staticPlan;
    });
  }, [apiPlans]);

  const toggleFAQ = useCallback((index: number) => {
    setOpenFAQIndex((prev) => (prev === index ? null : index));
  }, []);

  // Fonction pour créer la session Stripe Checkout
  const handleCheckout = useCallback(async (planId: string) => {
    try {
      // Créer la session checkout (fonctionne pour utilisateurs connectés ou non)
      // Stripe collectera l'email si l'utilisateur n'est pas connecté
      const response = await fetch('/api/billing/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          planId,
          email: user?.email, // Email optionnel, Stripe le demandera si manquant
          billing: isYearly ? 'yearly' : 'monthly',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création de la session');
      }

      const result = await response.json();
      
      if (!result.success || !result.data?.url) {
        throw new Error(result.message || 'Réponse invalide du serveur');
      }

      // Rediriger vers Stripe Checkout
      window.location.href = result.data.url;
    } catch (error) {
      logger.error('Erreur checkout Stripe', error);
      throw error;
    }
  }, [user, isYearly]);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              Tarification qui évolue avec vous
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-600">
              Commencez gratuitement avec 50 designs/mois. Votre premier mois est gratuit, sans
              carte bancaire.
            </p>
          </div>

          {/* Billing Toggle */}
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
              <button
                onClick={() => setIsYearly(false)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  !isYearly
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Mensuel
              </button>
              <button
                onClick={() => setIsYearly(true)}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  isYearly
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                Annuel
                <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                  -20%
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Plans Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
            {mergedPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} isYearly={isYearly} onCheckout={handleCheckout} />
            ))}
          </div>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="border-t border-gray-200 bg-gray-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Comparaison complète des fonctionnalités
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Découvrez toutes les fonctionnalités disponibles sur chaque plan
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <FeatureTable features={FEATURES} />
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="border-t border-gray-200 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Questions fréquemment posées
            </h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Enterprise CTA */}
      <section className="border-t border-gray-200 bg-gradient-to-br from-blue-600 to-purple-600 py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Besoin d'une solution Enterprise ?
          </h2>
          <p className="mt-4 text-lg text-blue-100">
            Tarification personnalisée, infrastructure dédiée, support 24/7 et bien plus encore.
          </p>
          <Link href="/contact?type=enterprise" className="mt-8 inline-block">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
              Contacter les ventes
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

const PricingPageContentMemo = React.memo(PricingPageContent);

export default function PricingPage() {
  return (
    <ErrorBoundary level="page" componentName="PricingPage">
      <PricingPageContentMemo />
    </ErrorBoundary>
  );
}

