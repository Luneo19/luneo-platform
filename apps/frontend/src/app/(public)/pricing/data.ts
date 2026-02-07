export type PlanTier = 'starter' | 'professional' | 'business' | 'enterprise';

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
    storage: string;
    teamMembers: number | string;
    apiCalls: number | string;
  };
};

export const PLANS: Plan[] = [
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
    priceYearly: 278.4,
    priceYearlyMonthly: 23.2,
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
    priceYearly: 950.4,
    priceYearlyMonthly: 79.2,
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
    priceMonthly: null,
    priceYearly: null,
    priceYearlyMonthly: null,
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

export const FEATURES: Feature[] = [
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

export const FAQS: { question: string; answer: string }[] = [
  {
    question: 'Puis-je changer de plan à tout moment ?',
    answer:
      'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont appliqués immédiatement et votre facturation est ajustée au prorata.',
  },
  {
    question: 'Que se passe-t-il si je dépasse mes limites ?',
    answer:
      'Sur les plans Starter et Professional, vous recevrez une notification lorsque vous approchez de vos limites. Sur le plan Business, vous pouvez acheter des crédits supplémentaires. Sur Enterprise, les limites sont flexibles selon vos besoins.',
  },
  {
    question: 'Y a-t-il un essai gratuit ?',
    answer:
      'Oui, le plan Starter est gratuit à vie avec 50 designs/mois. Les plans payants offrent un essai gratuit de 14 jours sans carte bancaire.',
  },
  {
    question: 'Les prix incluent-ils la TVA ?',
    answer:
      'Les prix affichés sont hors taxes. La TVA sera ajoutée lors du paiement selon votre localisation (20% en France).',
  },
  {
    question: 'Puis-je exporter mes données ?',
    answer:
      'Oui, vous pouvez exporter toutes vos données (designs, produits, configurations) à tout moment depuis les paramètres de votre compte.',
  },
  {
    question: 'Offrez-vous des remises pour les startups ?',
    answer:
      'Oui, nous offrons des remises spéciales pour les startups éligibles (Y Combinator, Techstars, etc.). Contactez-nous pour plus d\'informations.',
  },
];
