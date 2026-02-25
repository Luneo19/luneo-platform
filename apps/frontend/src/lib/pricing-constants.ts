/**
 * PRICING CONSTANTS - Luneo (Plans reels)
 *
 * The canonical source of truth is the backend API: GET /api/v1/plans/all
 * These static values are kept as fallback for SSR/initial render.
 *
 * To fetch live data, use: endpoints.billing.plans()
 */

export const PRICING = {
  free: {
    monthly: 0,
    yearly: 0,
    yearlyMonthly: 0,
    name: 'Gratuit',
  },
  starter: {
    monthly: 29,
    yearly: 276,
    yearlyMonthly: 23,
    name: 'Starter',
  },
  pro: {
    monthly: 79,
    yearly: 756,
    yearlyMonthly: 63,
    name: 'Pro',
  },
  business: {
    monthly: 79,
    yearly: 756,
    yearlyMonthly: 63,
    name: 'Business',
  },
  enterprise: {
    monthly: -1,
    yearly: -1,
    yearlyMonthly: -1,
    name: 'Enterprise',
  },
  /** @deprecated V1 alias - maps to pro */
  professional: {
    monthly: 79,
    yearly: 756,
    yearlyMonthly: 63,
    name: 'Pro',
  },
} as const;

/**
 * Plan limits
 * MUST match backend quotas/plan-limits.config.ts
 */
export const PLAN_LIMITS = {
  free: {
    agents: 1,
    conversationsPerMonth: 100,
    knowledgeBases: 1,
    documentsPerKB: 3,
    storageMB: 5,
    teamMembers: 1,
    channels: 1,
    allowedChannels: ['WIDGET'],
    analyticsRetentionDays: 7,
    apiAccess: false,
    visualBuilder: false,
    emailChannel: false,
    advancedAnalytics: false,
    whiteLabel: false,
    prioritySupport: false,
    customActions: false,
    ssoSaml: false,
    customIntegrations: false,
    abTesting: false,
    multiModelChoice: false,
    sentimentAnalysis: false,
    autoImprovement: false,
  },
  starter: {
    agents: 3,
    conversationsPerMonth: 1_000,
    knowledgeBases: 3,
    documentsPerKB: 10,
    storageMB: 25,
    teamMembers: 3,
    channels: 3,
    allowedChannels: ['WIDGET', 'EMAIL', 'TELEGRAM'],
    analyticsRetentionDays: 30,
    apiAccess: false,
    visualBuilder: true,
    emailChannel: true,
    advancedAnalytics: false,
    whiteLabel: false,
    prioritySupport: false,
    customActions: false,
    ssoSaml: false,
    customIntegrations: false,
    abTesting: false,
    multiModelChoice: true,
    sentimentAnalysis: false,
    autoImprovement: false,
  },
  pro: {
    agents: 10,
    conversationsPerMonth: 10_000,
    knowledgeBases: 10,
    documentsPerKB: 50,
    storageMB: 100,
    teamMembers: 10,
    channels: 9,
    allowedChannels: ['WIDGET', 'EMAIL', 'SLACK', 'WHATSAPP', 'MESSENGER', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'API'],
    analyticsRetentionDays: 90,
    apiAccess: true,
    visualBuilder: true,
    emailChannel: true,
    advancedAnalytics: true,
    whiteLabel: false,
    prioritySupport: true,
    customActions: true,
    ssoSaml: false,
    customIntegrations: true,
    abTesting: false,
    multiModelChoice: true,
    sentimentAnalysis: true,
    autoImprovement: true,
  },
  business: {
    agents: 25,
    conversationsPerMonth: 25_000,
    knowledgeBases: 10,
    documentsPerKB: 50,
    storageMB: 100,
    teamMembers: 25,
    channels: 9,
    allowedChannels: ['WIDGET', 'EMAIL', 'SLACK', 'WHATSAPP', 'MESSENGER', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'API'],
    analyticsRetentionDays: 90,
    apiAccess: true,
    visualBuilder: true,
    emailChannel: true,
    advancedAnalytics: true,
    whiteLabel: false,
    prioritySupport: true,
    customActions: true,
    ssoSaml: false,
    customIntegrations: true,
    abTesting: false,
    multiModelChoice: true,
    sentimentAnalysis: true,
    autoImprovement: true,
  },
  enterprise: {
    agents: -1,
    conversationsPerMonth: -1,
    knowledgeBases: -1,
    documentsPerKB: -1,
    storageMB: 500,
    teamMembers: -1,
    channels: -1,
    allowedChannels: ['WIDGET', 'EMAIL', 'SLACK', 'WHATSAPP', 'MESSENGER', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'API'],
    analyticsRetentionDays: 365,
    apiAccess: true,
    visualBuilder: true,
    emailChannel: true,
    advancedAnalytics: true,
    whiteLabel: true,
    prioritySupport: true,
    customActions: true,
    ssoSaml: true,
    customIntegrations: true,
    abTesting: true,
    multiModelChoice: true,
    sentimentAnalysis: true,
    autoImprovement: true,
  },
  /** @deprecated V1 alias - maps to pro */
  professional: {
    agents: 10,
    conversationsPerMonth: 10_000,
    knowledgeBases: 10,
    documentsPerKB: 50,
    storageMB: 100,
    teamMembers: 10,
    channels: 9,
    allowedChannels: ['WIDGET', 'EMAIL', 'SLACK', 'WHATSAPP', 'MESSENGER', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'API'],
    analyticsRetentionDays: 90,
    apiAccess: true,
    visualBuilder: true,
    emailChannel: true,
    advancedAnalytics: true,
    whiteLabel: false,
    prioritySupport: true,
    customActions: true,
    ssoSaml: false,
    customIntegrations: true,
    abTesting: false,
    multiModelChoice: true,
    sentimentAnalysis: true,
    autoImprovement: true,
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
