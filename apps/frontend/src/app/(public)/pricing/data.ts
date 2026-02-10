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
    storage: string;
    teamMembers: number | string;
    apiCalls: number | string;
  };
};

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
      'Export PNG',
      'Support communautaire',
      '1 membre',
      '0.5 GB stockage',
    ],
    limits: {
      designs: 5,
      renders2D: 10,
      renders3D: 0,
      storage: '0.5 GB',
      teamMembers: 1,
      apiCalls: 1000,
    },
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
      '50 designs/mois',
      'Customizer 2D',
      '100 rendus 2D/mois',
      '10 rendus 3D/mois',
      'Export PNG/PDF',
      'Support email',
      '3 membres d\'equipe',
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
      '250 designs/mois',
      'Customizer 2D + 3D',
      '500 rendus 2D/mois',
      '50 rendus 3D/mois',
      'Virtual Try-On',
      'API access',
      'Support prioritaire',
      '10 membres d\'equipe',
      '50 GB stockage',
      'Branding personnalise',
      'Webhooks temps reel',
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
    description: 'Pour les equipes qui ont besoin de collaboration et de volume',
    priceMonthly: PRICING.business.monthly,
    priceYearly: PRICING.business.yearly,
    priceYearlyMonthly: PRICING.business.yearlyMonthly,
    currency: 'EUR',
    cta: 'Demarrer l\'essai gratuit',
    ctaHref: '/register?plan=business',
    features: [
      '1000 designs/mois',
      'Toutes les fonctionnalites Pro',
      '2000 rendus 2D/mois',
      '200 rendus 3D/mois',
      'White-label complet',
      'API & SDKs',
      'Support dedie',
      '50 membres d\'equipe',
      '100 GB stockage',
      'SLA 99.5%',
      'Analytics avances',
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
    priceMonthly: PRICING.enterprise.monthly,
    priceYearly: PRICING.enterprise.yearly,
    priceYearlyMonthly: PRICING.enterprise.yearlyMonthly,
    currency: 'EUR',
    cta: 'Contacter les ventes',
    ctaHref: '/contact?type=enterprise',
    features: [
      'Designs illimites',
      'Rendus illimites',
      'Infrastructure dediee',
      'White-label complet',
      'API illimitee',
      'SSO/SAML',
      'SLA 99.99%',
      'Support 24/7',
      'Account manager',
      'Formation equipe',
      'Integrations custom',
    ],
    limits: {
      designs: 'Illimite',
      renders2D: 'Illimite',
      renders3D: 'Illimite',
      storage: 'Illimite',
      teamMembers: 'Illimite',
      apiCalls: 'Illimite',
    },
  },
];

export const FEATURES: Feature[] = [
  {
    id: 'base-price',
    name: 'Prix de base',
    category: 'platform',
    free: 'Gratuit',
    starter: '19\u20ac/mois',
    professional: '49\u20ac/mois',
    business: '99\u20ac/mois',
    enterprise: '299\u20ac/mois',
  },
  {
    id: 'designs-monthly',
    name: 'Designs/mois',
    description: 'Nombre de designs personnalises crees par mois',
    category: 'platform',
    free: '5',
    starter: '50',
    professional: '250',
    business: '1000',
    enterprise: 'Illimite',
  },
  {
    id: 'renders-2d',
    name: 'Rendus 2D/mois',
    description: 'Nombre de rendus 2D haute qualite par mois',
    category: 'platform',
    free: '10',
    starter: '100',
    professional: '500',
    business: '2000',
    enterprise: 'Illimite',
  },
  {
    id: 'renders-3d',
    name: 'Rendus 3D/mois',
    description: 'Nombre de rendus 3D par mois',
    category: 'platform',
    free: false,
    starter: '10',
    professional: '50',
    business: '200',
    enterprise: 'Illimite',
  },
  {
    id: 'storage',
    name: 'Stockage',
    description: 'Espace de stockage pour vos assets',
    category: 'platform',
    free: '0.5 GB',
    starter: '5 GB',
    professional: '50 GB',
    business: '100 GB',
    enterprise: 'Illimite',
  },
  {
    id: 'team-members',
    name: 'Membres d\'equipe',
    description: 'Nombre de membres pouvant acceder au compte',
    category: 'platform',
    free: '1',
    starter: '3',
    professional: '10',
    business: '50',
    enterprise: 'Illimite',
  },
  {
    id: 'customizer-2d',
    name: 'Customizer 2D',
    description: 'Editeur visuel 2D pour personnaliser vos produits',
    category: 'customization',
    free: true,
    starter: true,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'configurator-3d',
    name: 'Configurateur 3D',
    description: 'Configurateur 3D interactif temps reel',
    category: '3d',
    free: false,
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
    free: false,
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'ai-generation',
    name: 'Generation IA',
    description: 'Generation de designs avec IA (DALL-E, Stable Diffusion)',
    category: 'ai',
    free: '10/mois',
    starter: '50/mois',
    professional: '500/mois',
    business: '2000/mois',
    enterprise: 'Illimite',
  },
  {
    id: 'export-formats',
    name: 'Formats d\'export',
    description: 'PNG, PDF, SVG, GLB, USDZ, Print-ready CMYK',
    category: 'export',
    free: 'PNG',
    starter: 'PNG, PDF',
    professional: 'Tous formats',
    business: 'Tous formats + HD',
    enterprise: 'Tous formats + Custom',
  },
  {
    id: 'shopify',
    name: 'Integration Shopify',
    description: 'Widget embed pour Shopify',
    category: 'integrations',
    free: false,
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'woocommerce',
    name: 'Integration WooCommerce',
    description: 'Plugin WooCommerce',
    category: 'integrations',
    free: false,
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'api-access',
    name: 'Acces API',
    description: 'API REST complete pour integrations custom',
    category: 'integrations',
    free: false,
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Webhooks temps reel pour synchronisation',
    category: 'integrations',
    free: false,
    starter: false,
    professional: true,
    business: true,
    enterprise: true,
  },
  {
    id: 'real-time-collab',
    name: 'Collaboration temps reel',
    description: 'Edition collaborative en temps reel',
    category: 'collaboration',
    free: false,
    starter: false,
    professional: false,
    business: true,
    enterprise: true,
  },
  {
    id: 'white-label',
    name: 'White-label',
    description: 'Marque blanche complete',
    category: 'platform',
    free: false,
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
    free: false,
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
    free: false,
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
    free: 'Communautaire',
    starter: 'Email',
    professional: 'Prioritaire',
    business: 'Dedie',
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
      'Oui, le plan Free est gratuit a vie avec 5 designs/mois. Les plans payants (Starter, Professional, Business) offrent un essai gratuit de 14 jours sans carte bancaire.',
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
