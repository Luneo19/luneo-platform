import { PLAN_CONFIGS } from '@/libs/plans/plan-config';
import { PlanTier } from '@/libs/plans/plan-config.types';

export interface PlanLimits {
  maxAgents: number;
  maxMessagesPerMonth: number;
  maxKnowledgeBases: number;
  maxSourcesPerKb: number;
  maxFileUploadMb: number;
  maxChannels: number;
  allowedChannels: string[];
  maxTeamMembers: number;
  analyticsRetentionDays: number;
  features: {
    advancedAnalytics: boolean;
    customActions: boolean;
    apiAccess: boolean;
    whiteLabel: boolean;
    ssoSaml: boolean;
    prioritySupport: boolean;
    customIntegrations: boolean;
    workflowBuilder: boolean;
    abTesting: boolean;
    multiModelChoice: boolean;
    sentimentAnalysis: boolean;
    autoImprovement: boolean;
  };
}

const CHANNELS = {
  free: ['WIDGET'],
  pro: ['WIDGET', 'EMAIL', 'SLACK', 'WHATSAPP', 'MESSENGER', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'API'],
  business: ['WIDGET', 'EMAIL', 'SLACK', 'WHATSAPP', 'MESSENGER', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'API'],
  enterprise: ['WIDGET', 'EMAIL', 'SLACK', 'WHATSAPP', 'MESSENGER', 'INSTAGRAM', 'TELEGRAM', 'SMS', 'API'],
} as const;

const ANALYTICS_RETENTION_DAYS = {
  free: 7,
  pro: 90,
  business: 90,
  enterprise: 365,
} as const;

const MAX_UPLOAD_MB = {
  free: 5,
  pro: 25,
  business: 100,
  enterprise: 500,
} as const;

function createPlanLimits(tier: PlanTier): PlanLimits {
  const config = PLAN_CONFIGS[tier];
  const isUnlimited = tier === PlanTier.ENTERPRISE;
  const key =
    tier === PlanTier.FREE
      ? 'free'
      : tier === PlanTier.PRO
        ? 'pro'
        : tier === PlanTier.BUSINESS
          ? 'business'
          : 'enterprise';

  return {
    maxAgents: config.limits.agentsLimit,
    maxMessagesPerMonth: config.limits.conversationsPerMonth,
    maxKnowledgeBases: config.limits.knowledgeBasesLimit,
    // Legacy name kept for compatibility; maps to document capacity.
    maxSourcesPerKb: config.limits.documentsLimit,
    maxFileUploadMb: MAX_UPLOAD_MB[key],
    maxChannels: isUnlimited ? -1 : CHANNELS[key].length,
    allowedChannels: [...CHANNELS[key]],
    maxTeamMembers: config.limits.teamMembers,
    analyticsRetentionDays: ANALYTICS_RETENTION_DAYS[key],
    features: {
      advancedAnalytics: config.limits.advancedAnalytics,
      customActions: tier !== PlanTier.FREE,
      apiAccess: config.limits.apiAccess,
      whiteLabel: config.limits.whiteLabel,
      ssoSaml: tier === PlanTier.ENTERPRISE,
      prioritySupport: config.limits.prioritySupport,
      customIntegrations: tier !== PlanTier.FREE,
      workflowBuilder: config.limits.visualBuilder,
      abTesting: tier === PlanTier.ENTERPRISE,
      multiModelChoice: tier !== PlanTier.FREE,
      sentimentAnalysis: tier !== PlanTier.FREE,
      autoImprovement: tier !== PlanTier.FREE,
    },
  };
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: createPlanLimits(PlanTier.FREE),
  STARTER: createPlanLimits(PlanTier.PRO), // Backward compatibility alias
  PRO: createPlanLimits(PlanTier.PRO),
  BUSINESS: createPlanLimits(PlanTier.BUSINESS),
  ENTERPRISE: createPlanLimits(PlanTier.ENTERPRISE),
};
