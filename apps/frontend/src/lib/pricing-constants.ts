/**
 * PRICING CONSTANTS - Luneo (STATIC FALLBACK)
 *
 * The canonical source of truth is the backend API: GET /api/v1/plans/all
 * These static values are kept as fallback for SSR/initial render.
 *
 * To fetch live data, use: endpoints.billing.plans()
 *
 * Plans: FREE(0) | STARTER(19) | PROFESSIONAL(49) | BUSINESS(99) | ENTERPRISE(299)
 * Yearly discount: ~20% off (exact values from plan-config.ts)
 */

export const PRICING = {
  free: {
    monthly: 0,
    yearly: 0,
    yearlyMonthly: 0,
    name: 'Free',
  },
  starter: {
    monthly: 19,
    yearly: 190, // From plan-config.ts yearlyPrice
    yearlyMonthly: 15.83, // 190 / 12
    name: 'Starter',
  },
  professional: {
    monthly: 49,
    yearly: 490, // From plan-config.ts yearlyPrice
    yearlyMonthly: 40.83, // 490 / 12
    name: 'Professional',
  },
  business: {
    monthly: 99,
    yearly: 990, // From plan-config.ts yearlyPrice
    yearlyMonthly: 82.50, // 990 / 12
    name: 'Business',
  },
  enterprise: {
    monthly: 299,
    yearly: 2990, // From plan-config.ts yearlyPrice
    yearlyMonthly: 249.17, // 2990 / 12
    name: 'Enterprise',
  },
} as const;

/**
 * Plan limits - MUST match backend plan-config.ts (SINGLE SOURCE OF TRUTH)
 */
export const PLAN_LIMITS = {
  free: {
    designsPerMonth: 5,
    teamMembers: 1,
    storageGB: 0.5,
    maxProducts: 2,
    aiGenerations: 3,
    apiAccess: false,
    arEnabled: false,
    whiteLabel: false,
    advancedAnalytics: false,
    customExport: false,
    prioritySupport: false,
  },
  starter: {
    designsPerMonth: 50,
    teamMembers: 3,
    storageGB: 5,
    maxProducts: 10,
    aiGenerations: 20,
    apiAccess: false,
    arEnabled: false,
    whiteLabel: false,
    advancedAnalytics: false,
    customExport: false,
    prioritySupport: false,
  },
  professional: {
    designsPerMonth: 200,
    teamMembers: 10,
    storageGB: 25,
    maxProducts: 50,
    aiGenerations: 100,
    apiAccess: true,
    arEnabled: true,
    whiteLabel: true,
    advancedAnalytics: false,
    customExport: false,
    prioritySupport: true,
  },
  business: {
    designsPerMonth: 1000,
    teamMembers: 50,
    storageGB: 100,
    maxProducts: 500,
    aiGenerations: 500,
    apiAccess: true,
    arEnabled: true,
    whiteLabel: true,
    advancedAnalytics: true,
    customExport: true,
    prioritySupport: true,
  },
  enterprise: {
    designsPerMonth: -1, // unlimited
    teamMembers: -1,
    storageGB: -1,
    maxProducts: -1,
    aiGenerations: -1,
    apiAccess: true,
    arEnabled: true,
    whiteLabel: true,
    advancedAnalytics: true,
    customExport: true,
    prioritySupport: true,
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
