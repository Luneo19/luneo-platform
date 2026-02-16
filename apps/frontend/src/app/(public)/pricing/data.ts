import { PRICING } from '@/lib/pricing-constants';

export type PlanTier = 'free' | 'starter' | 'professional' | 'business' | 'enterprise';

export type FeatureCategory =
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

export type Feature = {
  id: string;
  name: string;
  description?: string;
  category: FeatureCategory;
  free: boolean | string;
  starter: boolean | string;
  professional: boolean | string;
  business: boolean | string;
  enterprise: boolean | string;
};

export type Plan = {
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
    virtualTryons: number | string;
    tryOnScreenshots: number | string;
    storage: string;
    teamMembers: number | string;
    apiCalls: number | string;
  };
};

/** Translator function signature */
type TFn = (key: string, variables?: Record<string, string | number>) => string;

/**
 * Returns translated PLANS array.
 * Plans aligned with backend source of truth: plan-config.ts
 * Last sync: Feb 2026
 */
export function getTranslatedPlans(t: TFn): Plan[] {
  return [
    {
      id: 'free',
      name: t('pricing.plans.free.name'),
      description: t('pricing.plans.free.description'),
      priceMonthly: 0,
      priceYearly: 0,
      priceYearlyMonthly: 0,
      currency: 'EUR',
      cta: t('pricing.plans.free.cta'),
      ctaHref: '/register',
      features: getTranslatedPlanFeatures(t, 'free'),
      limits: {
        designs: 5,
        renders2D: 10,
        renders3D: 0,
        virtualTryons: 10,
        tryOnScreenshots: 20,
        storage: '0.5 GB',
        teamMembers: 1,
        apiCalls: 0,
      },
    },
    {
      id: 'starter',
      name: t('pricing.plans.starter.name'),
      description: t('pricing.plans.starter.description'),
      priceMonthly: PRICING.starter.monthly,
      priceYearly: PRICING.starter.yearly,
      priceYearlyMonthly: PRICING.starter.yearlyMonthly,
      currency: 'EUR',
      cta: t('pricing.plans.starter.cta'),
      ctaHref: '/register?plan=starter',
      features: getTranslatedPlanFeatures(t, 'starter'),
      limits: {
        designs: 50,
        renders2D: 100,
        renders3D: 10,
        virtualTryons: 100,
        tryOnScreenshots: 500,
        storage: '5 GB',
        teamMembers: 3,
        apiCalls: 10000,
      },
    },
    {
      id: 'professional',
      name: t('pricing.plans.professional.name'),
      description: t('pricing.plans.professional.description'),
      priceMonthly: PRICING.professional.monthly,
      priceYearly: PRICING.professional.yearly,
      priceYearlyMonthly: PRICING.professional.yearlyMonthly,
      currency: 'EUR',
      popular: true,
      badge: t('pricing.plans.professional.badge'),
      cta: t('pricing.plans.professional.cta'),
      ctaHref: '/register?plan=professional',
      features: getTranslatedPlanFeatures(t, 'professional'),
      limits: {
        designs: 200,
        renders2D: 500,
        renders3D: 50,
        virtualTryons: 1000,
        tryOnScreenshots: 5000,
        storage: '25 GB',
        teamMembers: 10,
        apiCalls: 50000,
      },
    },
    {
      id: 'business',
      name: t('pricing.plans.business.name'),
      description: t('pricing.plans.business.description'),
      priceMonthly: PRICING.business.monthly,
      priceYearly: PRICING.business.yearly,
      priceYearlyMonthly: PRICING.business.yearlyMonthly,
      currency: 'EUR',
      cta: t('pricing.plans.business.cta'),
      ctaHref: '/register?plan=business',
      features: getTranslatedPlanFeatures(t, 'business'),
      limits: {
        designs: 1000,
        renders2D: 2000,
        renders3D: 200,
        virtualTryons: 10000,
        tryOnScreenshots: 50000,
        storage: '100 GB',
        teamMembers: 50,
        apiCalls: 200000,
      },
    },
    {
      id: 'enterprise',
      name: t('pricing.plans.enterprise.name'),
      description: t('pricing.plans.enterprise.description'),
      priceMonthly: null,
      priceYearly: null,
      priceYearlyMonthly: null,
      currency: 'EUR',
      cta: t('pricing.plans.enterprise.cta'),
      ctaHref: '/contact?plan=enterprise&source=pricing',
      features: getTranslatedPlanFeatures(t, 'enterprise'),
      limits: {
        designs: 'Unlimited',
        renders2D: 'Unlimited',
        renders3D: 'Unlimited',
        virtualTryons: 'Unlimited',
        tryOnScreenshots: 'Unlimited',
        storage: 'Unlimited',
        teamMembers: 'Unlimited',
        apiCalls: 'Unlimited',
      },
    },
  ];
}

/**
 * Helper: resolves the features array for a plan from translation.
 * The translation files store features as arrays under pricing.plans.<tier>.features.
 * Falls back to the key if translation is missing.
 */
function getTranslatedPlanFeatures(t: TFn, tier: PlanTier): string[] {
  // The features are stored as arrays in the translation file.
  // The t() function only resolves strings, so we iterate over indexed keys.
  // We know the max feature count per plan is ~14.
  const features: string[] = [];
  for (let i = 0; i < 20; i++) {
    const key = `pricing.plans.${tier}.features.${i}`;
    const value = t(key);
    // If t() returns the key itself, the feature doesn't exist
    if (value === key) break;
    features.push(value);
  }
  return features;
}

/**
 * Returns translated features comparison table.
 * Aligned with plan-config.ts (backend source of truth)
 * Last sync: Feb 2026
 */
export function getTranslatedFeatures(t: TFn): Feature[] {
  const fn = (id: string) => t(`pricing.featureNames.${id}`);
  const fd = (id: string) => {
    const val = t(`pricing.featureNames.${id}Desc`);
    return val === `pricing.featureNames.${id}Desc` ? undefined : val;
  };

  return [
    // ── PLATEFORME ──────────────────────────────────────────────
    {
      id: 'base-price',
      name: fn('base-price'),
      category: 'platform',
      free: t('pricing.featureValues.free'),
      starter: '19€/mois',
      professional: '49€/mois',
      business: '99€/mois',
      enterprise: '299€/mois',
    },
    {
      id: 'commission',
      name: fn('commission'),
      description: fd('commission'),
      category: 'platform',
      free: '10%',
      starter: '5%',
      professional: '3%',
      business: '2%',
      enterprise: '1%',
    },
    {
      id: 'designs-monthly',
      name: fn('designs-monthly'),
      description: fd('designs-monthly'),
      category: 'platform',
      free: '5',
      starter: '50',
      professional: '200',
      business: '1 000',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'products',
      name: fn('products'),
      description: fd('products'),
      category: 'platform',
      free: '2',
      starter: '10',
      professional: '50',
      business: '500',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'storage',
      name: fn('storage'),
      description: fd('storage'),
      category: 'platform',
      free: '0.5 GB',
      starter: '5 GB',
      professional: '25 GB',
      business: '100 GB',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'team-members',
      name: fn('team-members'),
      description: fd('team-members'),
      category: 'platform',
      free: '1',
      starter: '3',
      professional: '10',
      business: '50',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'overage',
      name: fn('overage'),
      description: fd('overage'),
      category: 'platform',
      free: t('pricing.featureValues.blocked'),
      starter: t('pricing.featureValues.usageBilling'),
      professional: t('pricing.featureValues.usageBilling'),
      business: t('pricing.featureValues.usageBilling'),
      enterprise: t('pricing.featureValues.negotiable'),
    },
    {
      id: 'addons',
      name: fn('addons'),
      description: fd('addons'),
      category: 'platform',
      free: false,
      starter: true,
      professional: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'white-label',
      name: fn('white-label'),
      description: fd('white-label'),
      category: 'platform',
      free: false,
      starter: false,
      professional: true,
      business: true,
      enterprise: true,
    },

    // ── PERSONNALISATION ────────────────────────────────────────
    {
      id: 'customizer-2d',
      name: fn('customizer-2d'),
      description: fd('customizer-2d'),
      category: 'customization',
      free: true,
      starter: true,
      professional: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'renders-2d',
      name: fn('renders-2d'),
      description: fd('renders-2d'),
      category: 'customization',
      free: '10',
      starter: '100',
      professional: '500',
      business: '2 000',
      enterprise: t('pricing.featureValues.unlimited'),
    },

    // ── IA ──────────────────────────────────────────────────────
    {
      id: 'ai-generation',
      name: fn('ai-generation'),
      description: fd('ai-generation'),
      category: 'ai',
      free: '3',
      starter: '20',
      professional: '100',
      business: '500',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'ai-tokens',
      name: fn('ai-tokens'),
      description: fd('ai-tokens'),
      category: 'ai',
      free: '50K',
      starter: '500K',
      professional: '2M',
      business: '5M',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'ai-credits',
      name: fn('ai-credits'),
      description: fd('ai-credits'),
      category: 'ai',
      free: false,
      starter: true,
      professional: true,
      business: true,
      enterprise: true,
    },

    // ── 3D ──────────────────────────────────────────────────────
    {
      id: 'configurator-3d',
      name: fn('configurator-3d'),
      description: fd('configurator-3d'),
      category: '3d',
      free: false,
      starter: false,
      professional: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'renders-3d',
      name: fn('renders-3d'),
      description: fd('renders-3d'),
      category: '3d',
      free: false,
      starter: '10',
      professional: '50',
      business: '200',
      enterprise: t('pricing.featureValues.unlimited'),
    },

    // ── AR ──────────────────────────────────────────────────────
    {
      id: 'virtual-try-on',
      name: fn('virtual-try-on'),
      description: fd('virtual-try-on'),
      category: 'ar',
      free: '10/mo',
      starter: '100/mo',
      professional: '1 000/mo',
      business: '10 000/mo',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'try-on-screenshots',
      name: fn('try-on-screenshots'),
      description: fd('try-on-screenshots'),
      category: 'ar',
      free: '20/mo',
      starter: '500/mo',
      professional: '5 000/mo',
      business: '50 000/mo',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'ar-webxr',
      name: fn('ar-webxr'),
      description: fd('ar-webxr'),
      category: 'ar',
      free: false,
      starter: false,
      professional: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'ar-quick-look',
      name: fn('ar-quick-look'),
      description: fd('ar-quick-look'),
      category: 'ar',
      free: false,
      starter: false,
      professional: true,
      business: true,
      enterprise: true,
    },

    // ── EXPORT ──────────────────────────────────────────────────
    {
      id: 'export-formats',
      name: fn('export-formats'),
      description: fd('export-formats'),
      category: 'export',
      free: 'PNG',
      starter: 'PNG, PDF',
      professional: t('pricing.featureValues.allFormats'),
      business: t('pricing.featureValues.allFormatsHd'),
      enterprise: t('pricing.featureValues.allFormatsCustom'),
    },
    {
      id: 'custom-export',
      name: fn('custom-export'),
      description: fd('custom-export'),
      category: 'export',
      free: false,
      starter: false,
      professional: false,
      business: true,
      enterprise: true,
    },

    // ── INTEGRATIONS ────────────────────────────────────────────
    {
      id: 'shopify',
      name: fn('shopify'),
      description: fd('shopify'),
      category: 'integrations',
      free: false,
      starter: false,
      professional: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'woocommerce',
      name: fn('woocommerce'),
      description: fd('woocommerce'),
      category: 'integrations',
      free: false,
      starter: false,
      professional: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'api-access',
      name: fn('api-access'),
      description: fd('api-access'),
      category: 'integrations',
      free: false,
      starter: false,
      professional: '50K calls/mo',
      business: '200K calls/mo',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'webhooks',
      name: fn('webhooks'),
      description: fd('webhooks'),
      category: 'integrations',
      free: false,
      starter: false,
      professional: true,
      business: true,
      enterprise: true,
    },

    // ── COLLABORATION ───────────────────────────────────────────
    {
      id: 'real-time-collab',
      name: fn('real-time-collab'),
      description: fd('real-time-collab'),
      category: 'collaboration',
      free: false,
      starter: false,
      professional: false,
      business: true,
      enterprise: true,
    },
    {
      id: 'ab-testing',
      name: fn('ab-testing'),
      description: fd('ab-testing'),
      category: 'collaboration',
      free: false,
      starter: false,
      professional: false,
      business: true,
      enterprise: true,
    },
    {
      id: 'advanced-analytics',
      name: fn('advanced-analytics'),
      description: fd('advanced-analytics'),
      category: 'collaboration',
      free: false,
      starter: false,
      professional: false,
      business: true,
      enterprise: true,
    },

    // ── SECURITE ────────────────────────────────────────────────
    {
      id: 'sso',
      name: fn('sso'),
      description: fd('sso'),
      category: 'security',
      free: false,
      starter: false,
      professional: false,
      business: false,
      enterprise: true,
    },
    {
      id: 'audit-logs',
      name: fn('audit-logs'),
      description: fd('audit-logs'),
      category: 'security',
      free: false,
      starter: false,
      professional: false,
      business: true,
      enterprise: true,
    },
    {
      id: 'sla',
      name: fn('sla'),
      description: fd('sla'),
      category: 'security',
      free: false,
      starter: false,
      professional: false,
      business: '99.5%',
      enterprise: '99.99%',
    },
    {
      id: 'support',
      name: fn('support'),
      description: fd('support'),
      category: 'security',
      free: t('pricing.featureValues.community'),
      starter: t('pricing.featureValues.email'),
      professional: t('pricing.featureValues.priority'),
      business: t('pricing.featureValues.dedicated'),
      enterprise: t('pricing.featureValues.support247'),
    },
  ];
}

/**
 * Returns translated FAQ items from the pricing.faq.items array.
 */
export function getTranslatedFaqs(t: TFn): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [];
  for (let i = 0; i < 20; i++) {
    const qKey = `pricing.faq.items.${i}.question`;
    const aKey = `pricing.faq.items.${i}.answer`;
    const question = t(qKey);
    const answer = t(aKey);
    // If t() returns the key itself, no more items
    if (question === qKey) break;
    faqs.push({ question, answer });
  }
  return faqs;
}

// ─── Legacy static exports (for backward compat / non-i18n usage) ───────────
// These are kept for components that haven't been migrated yet.
// Prefer getTranslatedPlans(t), getTranslatedFeatures(t), getTranslatedFaqs(t).

/** @deprecated Use getTranslatedPlans(t) instead */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Essayez Luneo gratuitement avec des fonctionnalites de base',
    priceMonthly: 0,
    priceYearly: 0,
    priceYearlyMonthly: 0,
    currency: 'EUR',
    cta: 'Commencer gratuitement',
    ctaHref: '/register',
    features: [
      '5 designs/mois',
      'Customizer 2D',
      '10 rendus 2D/mois',
      '3 generations IA/mois',
      'Export PNG',
      'Support communautaire',
      '1 membre',
      '0.5 GB stockage',
      'Commission 10%',
      '10 sessions Virtual Try-On/mois',
    ],
    limits: { designs: 5, renders2D: 10, renders3D: 0, virtualTryons: 10, tryOnScreenshots: 20, storage: '0.5 GB', teamMembers: 1, apiCalls: 0 },
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour les createurs independants et petits projets',
    priceMonthly: PRICING.starter.monthly,
    priceYearly: PRICING.starter.yearly,
    priceYearlyMonthly: PRICING.starter.yearlyMonthly,
    currency: 'EUR',
    cta: 'Demarrer l\'essai gratuit',
    ctaHref: '/register?plan=starter',
    features: [
      '50 designs/mois', 'Customizer 2D', '100 rendus 2D/mois', '10 rendus 3D/mois',
      '20 generations IA/mois', 'Export PNG/PDF', 'Support email', '3 membres d\'equipe',
      '5 GB stockage', 'Commission 5%', '100 sessions Virtual Try-On/mois', 'Add-ons disponibles',
    ],
    limits: { designs: 50, renders2D: 100, renders3D: 10, virtualTryons: 100, tryOnScreenshots: 500, storage: '5 GB', teamMembers: 3, apiCalls: 10000 },
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Pour les createurs et PME qui veulent passer a la vitesse superieure',
    priceMonthly: PRICING.professional.monthly,
    priceYearly: PRICING.professional.yearly,
    priceYearlyMonthly: PRICING.professional.yearlyMonthly,
    currency: 'EUR',
    popular: true,
    badge: 'LE PLUS POPULAIRE',
    cta: 'Demarrer l\'essai gratuit',
    ctaHref: '/register?plan=professional',
    features: [
      '200 designs/mois', 'Customizer 2D + 3D', '500 rendus 2D/mois', '50 rendus 3D/mois',
      '100 generations IA/mois', 'Virtual Try-On AR', 'API access', 'Support prioritaire',
      '10 membres d\'equipe', '25 GB stockage', 'White-label', 'Webhooks temps reel', 'Commission 3%',
      '1 000 sessions Virtual Try-On/mois',
    ],
    limits: { designs: 200, renders2D: 500, renders3D: 50, virtualTryons: 1000, tryOnScreenshots: 5000, storage: '25 GB', teamMembers: 10, apiCalls: 50000 },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Pour les equipes qui ont besoin de collaboration et de volume',
    priceMonthly: PRICING.business.monthly,
    priceYearly: PRICING.business.yearly,
    priceYearlyMonthly: PRICING.business.yearlyMonthly,
    currency: 'EUR',
    cta: 'Demarrer l\'essai gratuit',
    ctaHref: '/register?plan=business',
    features: [
      '1000 designs/mois', 'Toutes les fonctionnalites Pro', '2000 rendus 2D/mois',
      '200 rendus 3D/mois', '500 generations IA/mois', 'White-label complet', 'API & SDKs',
      'Analytics avances', 'A/B Testing', 'Support dedie', '50 membres d\'equipe',
      '100 GB stockage', 'SLA 99.5%', 'Commission 2%',
      '10 000 sessions Virtual Try-On/mois',
    ],
    limits: { designs: 1000, renders2D: 2000, renders3D: 200, virtualTryons: 10000, tryOnScreenshots: 50000, storage: '100 GB', teamMembers: 50, apiCalls: 200000 },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solution sur-mesure pour les grandes organisations',
    priceMonthly: null,
    priceYearly: null,
    priceYearlyMonthly: null,
    currency: 'EUR',
    cta: 'Contacter les ventes',
    ctaHref: '/contact?plan=enterprise&source=pricing',
    features: [
      'Designs illimites', 'Rendus illimites', 'Generations IA illimitees',
      'Infrastructure dediee', 'White-label complet', 'API illimitee', 'SSO/SAML',
      'SLA 99.99%', 'Support 24/7', 'Account manager', 'Formation equipe',
      'Integrations custom', 'Commission 1%',
      'Virtual Try-On illimite',
    ],
    limits: { designs: 'Illimite', renders2D: 'Illimite', renders3D: 'Illimite', virtualTryons: 'Illimite', tryOnScreenshots: 'Illimite', storage: 'Illimite', teamMembers: 'Illimite', apiCalls: 'Illimite' },
  },
];

/** @deprecated Use getTranslatedFeatures(t) instead */
export { PLANS as FEATURES_LEGACY };

/** @deprecated Use getTranslatedFaqs(t) instead */
export const FAQS: { question: string; answer: string }[] = [
  { question: 'Puis-je changer de plan à tout moment ?', answer: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont appliqués immédiatement et votre facturation est ajustée au prorata.' },
  { question: 'Que se passe-t-il si je dépasse mes limites ?', answer: 'Sur le plan Free, l\'utilisation est bloquée à la limite. Sur les plans payants (Starter, Professional, Business), des frais de dépassement s\'appliquent automatiquement (ex. : 0,30€/session Virtual Try-On supplémentaire pour Starter, 0,20€ pour Professional, 0,10€ pour Business). Le dépassement est plafonné à 5× votre limite mensuelle pour éviter les surprises. Sur Enterprise, les limites sont flexibles et négociables.' },
  { question: 'Y a-t-il un essai gratuit ?', answer: 'Oui, le plan Free est gratuit a vie avec 5 designs/mois. Les plans payants (Starter, Professional, Business) offrent un essai gratuit de 14 jours sans carte bancaire.' },
  { question: 'Les prix incluent-ils la TVA ?', answer: 'Les prix affichés sont hors taxes. La TVA sera ajoutée lors du paiement selon votre localisation (20% en France).' },
  { question: 'Puis-je exporter mes données ?', answer: 'Oui, vous pouvez exporter toutes vos données (designs, produits, configurations) à tout moment depuis les paramètres de votre compte.' },
  { question: 'Offrez-vous des remises pour les startups ?', answer: 'Oui, nous offrons des remises spéciales pour les startups éligibles (Y Combinator, Techstars, etc.). Contactez-nous pour plus d\'informations.' },
];
