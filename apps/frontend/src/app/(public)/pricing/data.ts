import { PRICING } from '@/lib/pricing-constants';

export type PlanTier = 'free' | 'pro' | 'business' | 'enterprise';

export type FeatureCategory =
  | 'agents'
  | 'conversations'
  | 'knowledge'
  | 'channels'
  | 'analytics'
  | 'security'
  | 'support';

export type Feature = {
  id: string;
  name: string;
  description?: string;
  category: FeatureCategory;
  free: boolean | string;
  pro: boolean | string;
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
    agents: number | string;
    conversationsPerMonth: number | string;
    knowledgeBases: number | string;
    documentsPerKB: number | string;
    storageMB: number | string;
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
        agents: 1,
        conversationsPerMonth: 100,
        knowledgeBases: 1,
        documentsPerKB: 10,
        storageMB: 500,
      },
    },
    {
      id: 'pro',
      name: t('pricing.plans.pro.name'),
      description: t('pricing.plans.pro.description'),
      priceMonthly: PRICING.pro.monthly,
      priceYearly: PRICING.pro.yearly,
      priceYearlyMonthly: PRICING.pro.yearlyMonthly,
      currency: 'EUR',
      popular: true,
      badge: t('pricing.plans.pro.badge'),
      cta: t('pricing.plans.pro.cta'),
      ctaHref: '/register?plan=pro',
      features: getTranslatedPlanFeatures(t, 'pro'),
      limits: {
        agents: 5,
        conversationsPerMonth: 2_000,
        knowledgeBases: 5,
        documentsPerKB: 50,
        storageMB: 10_000,
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
        agents: 25,
        conversationsPerMonth: 15_000,
        knowledgeBases: 25,
        documentsPerKB: 200,
        storageMB: 100_000,
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
        agents: t('pricing.featureValues.unlimited'),
        conversationsPerMonth: t('pricing.featureValues.unlimited'),
        knowledgeBases: t('pricing.featureValues.unlimited'),
        documentsPerKB: t('pricing.featureValues.unlimited'),
        storageMB: t('pricing.featureValues.unlimited'),
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
  const features: string[] = [];
  for (let i = 0; i < 20; i++) {
    const key = `pricing.plans.${tier}.features.${i}`;
    const value = t(key);
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
    // ── AGENTS IA ─────────────────────────────────────────────────
    {
      id: 'agents-count',
      name: fn('agents-count'),
      description: fd('agents-count'),
      category: 'agents',
      free: '1',
      pro: '5',
      business: '25',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'agent-templates',
      name: fn('agent-templates'),
      description: fd('agent-templates'),
      category: 'agents',
      free: t('pricing.featureValues.basic'),
      pro: t('pricing.featureValues.pro'),
      business: t('pricing.featureValues.all'),
      enterprise: t('pricing.featureValues.custom'),
    },
    {
      id: 'visual-builder',
      name: fn('visual-builder'),
      description: fd('visual-builder'),
      category: 'agents',
      free: false,
      pro: true,
      business: t('pricing.featureValues.advanced'),
      enterprise: t('pricing.featureValues.advanced'),
    },

    // ── CONVERSATIONS ─────────────────────────────────────────────
    {
      id: 'conversations-monthly',
      name: fn('conversations-monthly'),
      description: fd('conversations-monthly'),
      category: 'conversations',
      free: '100',
      pro: '2 000',
      business: '15 000',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'conversation-history',
      name: fn('conversation-history'),
      description: fd('conversation-history'),
      category: 'conversations',
      free: t('pricing.featureValues.days7'),
      pro: t('pricing.featureValues.days30'),
      business: t('pricing.featureValues.unlimited'),
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'multichannel',
      name: fn('multichannel'),
      description: fd('multichannel'),
      category: 'conversations',
      free: false,
      pro: false,
      business: true,
      enterprise: true,
    },

    // ── BASES DE CONNAISSANCES ────────────────────────────────────
    {
      id: 'knowledge-bases',
      name: fn('knowledge-bases'),
      description: fd('knowledge-bases'),
      category: 'knowledge',
      free: '1',
      pro: '5',
      business: '25',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'documents-per-kb',
      name: fn('documents-per-kb'),
      description: fd('documents-per-kb'),
      category: 'knowledge',
      free: '10',
      pro: '50',
      business: '200',
      enterprise: t('pricing.featureValues.unlimited'),
    },
    {
      id: 'max-doc-size',
      name: fn('max-doc-size'),
      description: fd('max-doc-size'),
      category: 'knowledge',
      free: '5 MB',
      pro: '25 MB',
      business: '100 MB',
      enterprise: t('pricing.featureValues.unlimited'),
    },

    // ── CANAUX ────────────────────────────────────────────────────
    {
      id: 'widget-chat',
      name: fn('widget-chat'),
      description: fd('widget-chat'),
      category: 'channels',
      free: true,
      pro: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'email-channel',
      name: fn('email-channel'),
      description: fd('email-channel'),
      category: 'channels',
      free: false,
      pro: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'api-access',
      name: fn('api-access'),
      description: fd('api-access'),
      category: 'channels',
      free: false,
      pro: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'slack-channel',
      name: fn('slack-channel'),
      description: fd('slack-channel'),
      category: 'channels',
      free: false,
      pro: false,
      business: true,
      enterprise: true,
    },
    {
      id: 'whatsapp-channel',
      name: fn('whatsapp-channel'),
      description: fd('whatsapp-channel'),
      category: 'channels',
      free: false,
      pro: false,
      business: true,
      enterprise: true,
    },

    // ── ANALYTICS ─────────────────────────────────────────────────
    {
      id: 'basic-analytics',
      name: fn('basic-analytics'),
      description: fd('basic-analytics'),
      category: 'analytics',
      free: true,
      pro: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'advanced-analytics',
      name: fn('advanced-analytics'),
      description: fd('advanced-analytics'),
      category: 'analytics',
      free: false,
      pro: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'export-analytics',
      name: fn('export-analytics'),
      description: fd('export-analytics'),
      category: 'analytics',
      free: false,
      pro: false,
      business: true,
      enterprise: true,
    },
    {
      id: 'ai-insights',
      name: fn('ai-insights'),
      description: fd('ai-insights'),
      category: 'analytics',
      free: false,
      pro: false,
      business: true,
      enterprise: true,
    },

    // ── SÉCURITÉ ──────────────────────────────────────────────────
    {
      id: 'twofa',
      name: fn('twofa'),
      description: fd('twofa'),
      category: 'security',
      free: true,
      pro: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'sso',
      name: fn('sso'),
      description: fd('sso'),
      category: 'security',
      free: false,
      pro: false,
      business: false,
      enterprise: true,
    },
    {
      id: 'rbac',
      name: fn('rbac'),
      description: fd('rbac'),
      category: 'security',
      free: false,
      pro: true,
      business: true,
      enterprise: true,
    },
    {
      id: 'audit-logs',
      name: fn('audit-logs'),
      description: fd('audit-logs'),
      category: 'security',
      free: false,
      pro: false,
      business: true,
      enterprise: true,
    },

    // ── SUPPORT ───────────────────────────────────────────────────
    {
      id: 'support-type',
      name: fn('support-type'),
      description: fd('support-type'),
      category: 'support',
      free: t('pricing.featureValues.community'),
      pro: t('pricing.featureValues.priority'),
      business: t('pricing.featureValues.dedicated'),
      enterprise: t('pricing.featureValues.support247'),
    },
    {
      id: 'sla',
      name: fn('sla'),
      description: fd('sla'),
      category: 'support',
      free: false,
      pro: false,
      business: '99.5%',
      enterprise: '99.99%',
    },
    {
      id: 'account-manager',
      name: fn('account-manager'),
      description: fd('account-manager'),
      category: 'support',
      free: false,
      pro: false,
      business: false,
      enterprise: true,
    },
    {
      id: 'onboarding',
      name: fn('onboarding'),
      description: fd('onboarding'),
      category: 'support',
      free: false,
      pro: t('pricing.featureValues.selfService'),
      business: t('pricing.featureValues.guided'),
      enterprise: t('pricing.featureValues.dedicated'),
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
    if (question === qKey) break;
    faqs.push({ question, answer });
  }
  return faqs;
}

// ─── Legacy static exports (for backward compat / non-i18n usage) ───────────

/** @deprecated Use getTranslatedPlans(t) instead */
export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Gratuit',
    description: 'Découvrez les agents IA Luneo gratuitement',
    priceMonthly: 0,
    priceYearly: 0,
    priceYearlyMonthly: 0,
    currency: 'EUR',
    cta: 'Commencer gratuitement',
    ctaHref: '/register',
    features: [
      '1 agent IA',
      '50 conversations/mois',
      '1 base de connaissances',
      'Widget chat basique',
      'Historique 7 jours',
      'Analytics basiques',
      '2FA',
      'Support communautaire',
    ],
    limits: { agents: 1, conversationsPerMonth: 100, knowledgeBases: 1, documentsPerKB: 10, storageMB: 500 },
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Pour les équipes qui veulent des agents IA performants',
    priceMonthly: PRICING.pro.monthly,
    priceYearly: PRICING.pro.yearly,
    priceYearlyMonthly: PRICING.pro.yearlyMonthly,
    currency: 'EUR',
    popular: true,
    badge: 'LE PLUS POPULAIRE',
    cta: "Démarrer l'essai gratuit",
    ctaHref: '/register?plan=pro',
    features: [
      '5 agents IA',
      '2 000 conversations/mois',
      '5 bases de connaissances',
      'Visual Builder',
      'Canal email',
      'Analytics avancés',
      'Historique 30 jours',
      'Support prioritaire',
    ],
    limits: { agents: 5, conversationsPerMonth: 2_000, knowledgeBases: 5, documentsPerKB: 50, storageMB: 10_000 },
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Pour les entreprises avec des besoins avancés en IA',
    priceMonthly: PRICING.business.monthly,
    priceYearly: PRICING.business.yearly,
    priceYearlyMonthly: PRICING.business.yearlyMonthly,
    currency: 'EUR',
    cta: "Démarrer l'essai gratuit",
    ctaHref: '/register?plan=business',
    features: [
      '20 agents IA',
      '10 000 conversations/mois',
      '20 bases de connaissances',
      'Visual Builder avancé',
      'Tous les canaux (Email, Slack, WhatsApp)',
      'Analytics avancés + exports',
      'White-label',
      'API access',
      'Historique illimité',
      'Support dédié',
    ],
    limits: { agents: 25, conversationsPerMonth: 15_000, knowledgeBases: 25, documentsPerKB: 200, storageMB: 100_000 },
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
      'Agents IA illimités',
      'Conversations illimitées',
      'Bases de connaissances illimitées',
      'SSO / SAML',
      'SLA garanti 99.99%',
      'Account manager dédié',
      'Déploiement on-premise possible',
      'Support 24/7',
      'Audit logs',
      'Intégrations personnalisées',
    ],
    limits: { agents: 'Illimité', conversationsPerMonth: 'Illimité', knowledgeBases: 'Illimité', documentsPerKB: 'Illimité', storageMB: 'Illimité' },
  },
];

/** @deprecated Use getTranslatedFeatures(t) instead */
export { PLANS as FEATURES_LEGACY };

/** @deprecated Use getTranslatedFaqs(t) instead */
export const FAQS: { question: string; answer: string }[] = [
  { question: 'Puis-je changer de plan à tout moment ?', answer: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont appliqués immédiatement et votre facturation est ajustée au prorata.' },
  { question: 'Que se passe-t-il si je dépasse mes limites de conversations ?', answer: 'Sur le plan Gratuit, les conversations sont bloquées à la limite. Sur les plans Pro et Business, vous recevrez une notification et pourrez acheter des conversations supplémentaires. Sur Enterprise, les limites sont flexibles et négociables.' },
  { question: 'Y a-t-il un essai gratuit ?', answer: 'Oui, le plan Gratuit est gratuit à vie avec 1 agent IA et 50 conversations/mois. Les plans Pro et Business offrent un essai gratuit de 14 jours sans carte bancaire.' },
  { question: 'Les prix incluent-ils la TVA ?', answer: 'Les prix affichés sont hors taxes. La TVA sera ajoutée lors du paiement selon votre localisation (20% en France).' },
  { question: 'Puis-je exporter mes données ?', answer: 'Oui, vous pouvez exporter toutes vos données (historique de conversations, bases de connaissances, configurations d\'agents) à tout moment depuis les paramètres de votre compte.' },
  { question: 'Offrez-vous des remises pour les startups ?', answer: 'Oui, nous offrons des remises spéciales pour les startups éligibles (Y Combinator, Techstars, etc.). Contactez-nous pour plus d\'informations.' },
];
