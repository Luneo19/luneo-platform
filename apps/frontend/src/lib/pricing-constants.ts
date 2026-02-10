/**
 * PRICING CONSTANTS - Luneo
 * 
 * MUST match backend source of truth: apps/backend/src/libs/plans/plan-config.ts
 * 
 * Plans: FREE(0) | STARTER(19) | PROFESSIONAL(49) | BUSINESS(99) | ENTERPRISE(299)
 * Yearly discount: ~20% off (exact values from plan-config.ts)
 */

export const PRICING = {
  starter: {
    monthly: 19,
    yearly: 190, // From plan-config.ts yearlyPrice
    yearlyMonthly: 15.83, // 190 / 12
    name: 'Starter',
    stripePriceId: 'price_1SY2bqKG9MsM6fdSlgkR5hNX',
    stripePriceIdYearly: 'price_1SY2bxKG9MsM6fdSe78TX8fZ',
  },
  professional: {
    monthly: 49,
    yearly: 490, // From plan-config.ts yearlyPrice
    yearlyMonthly: 40.83, // 490 / 12
    name: 'Professional',
    stripePriceId: 'price_1SY2cEKG9MsM6fdSTKND31Ti',
    stripePriceIdYearly: 'price_1SY2cEKG9MsM6fdSDKL1gPye',
  },
  business: {
    monthly: 99,
    yearly: 990, // From plan-config.ts yearlyPrice
    yearlyMonthly: 82.50, // 990 / 12
    name: 'Business',
    stripePriceId: 'price_1SY2cTKG9MsM6fdSwoQu1S5I',
    stripePriceIdYearly: 'price_1SY2cUKG9MsM6fdShCcJvXO7',
  },
  enterprise: {
    monthly: 299,
    yearly: 2990, // From plan-config.ts yearlyPrice
    yearlyMonthly: 249.17, // 2990 / 12
    name: 'Enterprise',
    stripePriceId: null, // Custom pricing via sales
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
  const monthly = p.monthly as number;
  if (monthly === 0) return 0;
  
  const annualTotal = monthly * 12;
  const discount = ((annualTotal - p.yearly) / annualTotal) * 100;
  return Math.round(discount);
};
