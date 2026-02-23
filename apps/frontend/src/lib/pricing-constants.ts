/**
 * PRICING CONSTANTS - Luneo V2 (Agents IA)
 *
 * The canonical source of truth is the backend API: GET /api/v1/plans/all
 * These static values are kept as fallback for SSR/initial render.
 *
 * To fetch live data, use: endpoints.billing.plans()
 *
 * Plans: FREE(0) | PRO(49) | BUSINESS(149) | ENTERPRISE(sur devis)
 * Yearly discount: ~20% off (2 mois offerts)
 */

export const PRICING = {
  free: {
    monthly: 0,
    yearly: 0,
    yearlyMonthly: 0,
    name: 'Gratuit',
  },
  pro: {
    monthly: 49,
    yearly: 468,
    yearlyMonthly: 39,
    name: 'Pro',
  },
  business: {
    monthly: 149,
    yearly: 1428,
    yearlyMonthly: 119,
    name: 'Business',
  },
  enterprise: {
    monthly: -1,
    yearly: -1,
    yearlyMonthly: -1,
    name: 'Enterprise',
  },
  /** @deprecated V1 alias — maps to pro */
  starter: {
    monthly: 49,
    yearly: 468,
    yearlyMonthly: 39,
    name: 'Pro',
  },
  /** @deprecated V1 alias — maps to pro */
  professional: {
    monthly: 49,
    yearly: 468,
    yearlyMonthly: 39,
    name: 'Pro',
  },
} as const;

/**
 * Plan limits — V2 Agents IA
 * MUST match backend plan-config.ts (SINGLE SOURCE OF TRUTH)
 */
export const PLAN_LIMITS = {
  free: {
    agents: 1,
    conversationsPerMonth: 50,
    knowledgeBases: 1,
    documentsPerKB: 10,
    storageMB: 500,
    teamMembers: 1,
    apiAccess: false,
    visualBuilder: false,
    emailChannel: false,
    advancedAnalytics: false,
    whiteLabel: false,
    prioritySupport: false,
  },
  pro: {
    agents: 5,
    conversationsPerMonth: 2_000,
    knowledgeBases: 5,
    documentsPerKB: 50,
    storageMB: 5_000,
    teamMembers: 5,
    apiAccess: true,
    visualBuilder: true,
    emailChannel: true,
    advancedAnalytics: true,
    whiteLabel: false,
    prioritySupport: true,
  },
  business: {
    agents: 20,
    conversationsPerMonth: 10_000,
    knowledgeBases: 20,
    documentsPerKB: 200,
    storageMB: 25_000,
    teamMembers: 20,
    apiAccess: true,
    visualBuilder: true,
    emailChannel: true,
    advancedAnalytics: true,
    whiteLabel: true,
    prioritySupport: true,
  },
  enterprise: {
    agents: -1,
    conversationsPerMonth: -1,
    knowledgeBases: -1,
    documentsPerKB: -1,
    storageMB: -1,
    teamMembers: -1,
    apiAccess: true,
    visualBuilder: true,
    emailChannel: true,
    advancedAnalytics: true,
    whiteLabel: true,
    prioritySupport: true,
  },
  /** @deprecated V1 alias — maps to pro */
  starter: {
    agents: 5,
    conversationsPerMonth: 2_000,
    knowledgeBases: 5,
    documentsPerKB: 50,
    storageMB: 5_000,
    teamMembers: 5,
    apiAccess: true,
    visualBuilder: true,
    emailChannel: true,
    advancedAnalytics: true,
    whiteLabel: false,
    prioritySupport: true,
  },
  /** @deprecated V1 alias — maps to pro */
  professional: {
    agents: 5,
    conversationsPerMonth: 2_000,
    knowledgeBases: 5,
    documentsPerKB: 50,
    storageMB: 5_000,
    teamMembers: 5,
    apiAccess: true,
    visualBuilder: true,
    emailChannel: true,
    advancedAnalytics: true,
    whiteLabel: false,
    prioritySupport: true,
  },
} as const;

export const COMPETITOR_PRICING = {
  intercom: {
    monthly: 74,
    yearly: 888,
    name: 'Intercom',
  },
  drift: {
    monthly: 150,
    yearly: 1800,
    name: 'Drift',
  },
  zendesk: {
    monthly: 55,
    yearly: 660,
    name: 'Zendesk AI',
  },
} as const;

/**
 * Calcule les économies par rapport à la concurrence
 */
export const calculateSavings = () => {
  const luneoYearly = PRICING.pro.yearlyMonthly;
  const competitorAvg = (
    COMPETITOR_PRICING.intercom.monthly +
    COMPETITOR_PRICING.drift.monthly +
    COMPETITOR_PRICING.zendesk.monthly
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
  if (monthly <= 0) return 0;

  const annualTotal = monthly * 12;
  const discount = ((annualTotal - p.yearly) / annualTotal) * 100;
  return Math.round(discount);
};
