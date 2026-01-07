/**
 * Plans de facturation disponibles
 */

import type { Plan } from '../types';

export const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Parfait pour démarrer',
    price: {
      monthly: 29,
      yearly: 278, // -20%
    },
    features: [
      '5 générations AI par mois',
      'Designs illimités',
      'Support email',
      'Templates de base',
    ],
  },
  {
    id: 'pro',
    name: 'Professional',
    description: 'Pour les professionnels',
    price: {
      monthly: 49,
      yearly: 470, // -20%
    },
    features: [
      '50 générations AI par mois',
      'Designs illimités',
      'Support prioritaire',
      'Tous les templates',
      'Export haute qualité',
    ],
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Pour les grandes équipes',
    price: {
      monthly: 99,
      yearly: 950, // -20%
    },
    features: [
      'Générations AI illimitées',
      'Designs illimités',
      'Support dédié',
      'Tous les templates',
      'Export haute qualité',
      'API access',
      'Team management',
    ],
  },
];


