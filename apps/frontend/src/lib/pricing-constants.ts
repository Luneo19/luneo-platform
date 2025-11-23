/**
 * 💰 PRICING CONSTANTS - Luneo
 * 
 * Centralisation de tous les prix pour éviter les hardcoded values
 * Modifier ici pour mettre à jour tous les prix du site
 */

export const PRICING = {
  starter: {
    monthly: 0,
    yearly: 0,
    name: 'Starter',
    stripePriceId: null,
  },
  professional: {
    monthly: 29,
    yearly: 278.40, // 29 * 12 * 0.8 = -20%
    yearlyMonthly: 23.20, // 278.40 / 12
    name: 'Professional',
    stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_PRO_MONTHLY',
  },
  business: {
    monthly: 59,
    yearly: 566.40, // 59 * 12 * 0.8 = -20%
    yearlyMonthly: 47.20, // 566.40 / 12
    name: 'Business',
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS || 'price_BUSINESS_MONTHLY',
  },
  enterprise: {
    monthly: 99,
    yearly: 950.40, // 99 * 12 * 0.8 = -20%
    yearlyMonthly: 79.20, // 950.40 / 12
    name: 'Enterprise',
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_ENTERPRISE_MONTHLY',
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



