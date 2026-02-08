// IMPORTANT: Prices must match backend plan-config.ts -- source of truth is GET /pricing/plans

/**
 * Plans de facturation disponibles
 */

import type { Plan } from '../types';

export const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Découvrez Luneo gratuitement',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      '5 designs/mois',
      '2 produits',
      'Support email',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour démarrer',
    price: {
      monthly: 19,
      yearly: 190,
    },
    features: [
      '50 designs/mois',
      '10 produits',
      '3 membres',
      'Support prioritaire',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Pour les créateurs professionnels',
    price: {
      monthly: 49,
      yearly: 490,
    },
    features: [
      '200 designs/mois',
      '50 produits',
      '10 membres',
      'API access',
      'AR enabled',
      'White label',
    ],
    popular: true,
  },
  {
    id: 'business',
    name: 'Business',
    description: 'Pour les équipes en croissance',
    price: {
      monthly: 99,
      yearly: 990,
    },
    features: [
      '1000 designs/mois',
      '500 produits',
      '50 membres',
      'Analytics avancés',
      'Export personnalisé',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Solutions sur mesure',
    price: {
      monthly: 299,
      yearly: 2990,
    },
    features: [
      'Illimité',
      'Support dédié',
      'SLA garanti',
      'Formation',
      'Intégration personnalisée',
    ],
  },
];
