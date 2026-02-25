export interface DefaultFeatureFlagConfig {
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
}

export const DEFAULT_FEATURE_FLAGS: DefaultFeatureFlagConfig[] = [
  { key: 'multi_model_choice', description: 'Allow users to choose AI model', enabled: true, rolloutPercentage: 100 },
  { key: 'web_crawler', description: 'AI website scanner for persona generation', enabled: true, rolloutPercentage: 100 },
  { key: 'multi_channel', description: 'WhatsApp, Telegram, SMS channels', enabled: false, rolloutPercentage: 0 },
  { key: 'advanced_analytics', description: 'ROI, sentiment, conversion funnel', enabled: true, rolloutPercentage: 50 },
  { key: 'workflow_builder_v2', description: 'Advanced workflow conditions and loops', enabled: true, rolloutPercentage: 30 },
  { key: 'custom_actions', description: 'Custom API actions for agents', enabled: false, rolloutPercentage: 0 },
  { key: 'auto_improvement', description: 'AI auto-learning from conversations', enabled: true, rolloutPercentage: 20 },
  { key: 'smart_handoff', description: 'Intelligent AI-to-human handoff', enabled: true, rolloutPercentage: 100 },
  { key: 'light_mode', description: 'Light theme support', enabled: true, rolloutPercentage: 100 },
  { key: 'widget_v2', description: 'New widget design with glassmorphism', enabled: true, rolloutPercentage: 100 },
];
