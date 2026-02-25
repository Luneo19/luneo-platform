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

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  FREE: {
    maxAgents: 1,
    maxMessagesPerMonth: 100,
    maxKnowledgeBases: 1,
    maxSourcesPerKb: 3,
    maxFileUploadMb: 5,
    maxChannels: 1,
    allowedChannels: ['WIDGET'],
    maxTeamMembers: 1,
    analyticsRetentionDays: 7,
    features: {
      advancedAnalytics: false,
      customActions: false,
      apiAccess: false,
      whiteLabel: false,
      ssoSaml: false,
      prioritySupport: false,
      customIntegrations: false,
      workflowBuilder: false,
      abTesting: false,
      multiModelChoice: false,
      sentimentAnalysis: false,
      autoImprovement: false,
    },
  },
  STARTER: {
    maxAgents: 3,
    maxMessagesPerMonth: 1000,
    maxKnowledgeBases: 3,
    maxSourcesPerKb: 10,
    maxFileUploadMb: 25,
    maxChannels: 3,
    allowedChannels: ['WIDGET', 'EMAIL', 'TELEGRAM'],
    maxTeamMembers: 3,
    analyticsRetentionDays: 30,
    features: {
      advancedAnalytics: false,
      customActions: false,
      apiAccess: false,
      whiteLabel: false,
      ssoSaml: false,
      prioritySupport: false,
      customIntegrations: false,
      workflowBuilder: true,
      abTesting: false,
      multiModelChoice: true,
      sentimentAnalysis: false,
      autoImprovement: false,
    },
  },
  PRO: {
    maxAgents: 10,
    maxMessagesPerMonth: 10000,
    maxKnowledgeBases: 10,
    maxSourcesPerKb: 50,
    maxFileUploadMb: 100,
    maxChannels: 9,
    allowedChannels: [
      'WIDGET',
      'EMAIL',
      'SLACK',
      'WHATSAPP',
      'MESSENGER',
      'INSTAGRAM',
      'TELEGRAM',
      'SMS',
      'API',
    ],
    maxTeamMembers: 10,
    analyticsRetentionDays: 90,
    features: {
      advancedAnalytics: true,
      customActions: true,
      apiAccess: true,
      whiteLabel: false,
      ssoSaml: false,
      prioritySupport: true,
      customIntegrations: true,
      workflowBuilder: true,
      abTesting: false,
      multiModelChoice: true,
      sentimentAnalysis: true,
      autoImprovement: true,
    },
  },
  BUSINESS: {
    maxAgents: 25,
    maxMessagesPerMonth: 25000,
    maxKnowledgeBases: 10,
    maxSourcesPerKb: 50,
    maxFileUploadMb: 100,
    maxChannels: 9,
    allowedChannels: [
      'WIDGET',
      'EMAIL',
      'SLACK',
      'WHATSAPP',
      'MESSENGER',
      'INSTAGRAM',
      'TELEGRAM',
      'SMS',
      'API',
    ],
    maxTeamMembers: 25,
    analyticsRetentionDays: 90,
    features: {
      advancedAnalytics: true,
      customActions: true,
      apiAccess: true,
      whiteLabel: false,
      ssoSaml: false,
      prioritySupport: true,
      customIntegrations: true,
      workflowBuilder: true,
      abTesting: false,
      multiModelChoice: true,
      sentimentAnalysis: true,
      autoImprovement: true,
    },
  },
  ENTERPRISE: {
    maxAgents: -1,
    maxMessagesPerMonth: -1,
    maxKnowledgeBases: -1,
    maxSourcesPerKb: -1,
    maxFileUploadMb: 500,
    maxChannels: -1,
    allowedChannels: [
      'WIDGET',
      'EMAIL',
      'SLACK',
      'WHATSAPP',
      'MESSENGER',
      'INSTAGRAM',
      'TELEGRAM',
      'SMS',
      'API',
    ],
    maxTeamMembers: -1,
    analyticsRetentionDays: 365,
    features: {
      advancedAnalytics: true,
      customActions: true,
      apiAccess: true,
      whiteLabel: true,
      ssoSaml: true,
      prioritySupport: true,
      customIntegrations: true,
      workflowBuilder: true,
      abTesting: true,
      multiModelChoice: true,
      sentimentAnalysis: true,
      autoImprovement: true,
    },
  },
};
