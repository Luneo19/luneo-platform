/**
 * 💰 PRICING CONSTANTS - Luneo
 * 
 * Centralisation de tous les prix pour éviter les hardcoded values
 * Modifier ici pour mettre à jour tous les prix du site
 */

export const PRICING = {
  starter: {
    monthly: 29,
    yearly: 278.40, // 29 * 12 * 0.8 = -20%
    yearlyMonthly: 23.20, // 278.40 / 12
    name: 'Starter',
    stripePriceId: 'price_1SY2bqKG9MsM6fdSlgkR5hNX',
    stripePriceIdYearly: 'price_1SY2bxKG9MsM6fdSe78TX8fZ',
  },
  professional: {
    monthly: 49,
    yearly: 470.40, // 49 * 12 * 0.8 = -20%
    yearlyMonthly: 39.20, // 470.40 / 12
    name: 'Professional',
    stripePriceId: 'price_1SY2cEKG9MsM6fdSTKND31Ti',
    stripePriceIdYearly: 'price_1SY2cEKG9MsM6fdSDKL1gPye',
  },
  business: {
    monthly: 99,
    yearly: 950.40, // 99 * 12 * 0.8 = -20%
    yearlyMonthly: 79.20, // 950.40 / 12
    name: 'Business',
    stripePriceId: 'price_1SY2cTKG9MsM6fdSwoQu1S5I',
    stripePriceIdYearly: 'price_1SY2cUKG9MsM6fdShCcJvXO7',
  },
  enterprise: {
    monthly: 0, // Sur demande
    yearly: 0,
    yearlyMonthly: 0,
    name: 'Enterprise',
    stripePriceId: null, // Sur demande - pas de prix Stripe
    stripePriceIdYearly: null,
  },
} as const;

export const COMPETITOR_PRICING = {
  canva: {
    monthly: 42,
    yearly: 504,
    name: 'Canva Pro',
  },
  zakeke: {
    monthly: 84,
    yearly: 1008,
    name: 'Zakeke',
  },
  threekit: {
    monthly: 210,
    yearly: 2520,
    name: '3DKit',
  },
} as const;

/**
 * Calcule les économies par rapport à la concurrence
 */
export const calculateSavings = () => {
  const luneoYearly = PRICING.professional.yearlyMonthly;
  const competitorAvg = (
    COMPETITOR_PRICING.canva.monthly +
    COMPETITOR_PRICING.zakeke.monthly +
    COMPETITOR_PRICING.threekit.monthly
  ) / 3;
  
  const savings = Math.round((1 - luneoYearly / competitorAvg) * 100);
  return {
    percentage: savings,
    luneoPrice: luneoYearly,
    competitorAvg,
    savingsAmount: competitorAvg - luneoYearly,
  };
};

/**
 * Calcule la réduction annuelle
 */
export const getYearlyDiscount = (plan: keyof typeof PRICING) => {
  const p = PRICING[plan];
  if (p.monthly === 0) return 0;
  
  const annualTotal = p.monthly * 12;
  const discount = ((annualTotal - p.yearly) / annualTotal) * 100;
  return Math.round(discount);
};

// Exemple d'utilisation:
// const savings = calculateSavings();
// console.log(`Économies: -${savings.percentage}%`); // -77%
// console.log(`Prix Luneo: ${savings.luneoPrice}€/mois vs ${savings.competitorAvg}€/mois`);



