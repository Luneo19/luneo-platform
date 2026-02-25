export const KPI_Funnel_Events = {
  acquisition: [
    'page_enter',
    'register',
  ],
  activation: [
    'tutorial_start',
    'tutorial_complete',
    'feature_discover',
  ],
  conversion: [
    'checkout_start',
    'checkout_complete',
    'purchase',
  ],
  retention: [
    'login',
    'customizer_open',
    'design_save',
  ],
} as const;

export type KpiFunnelStage = keyof typeof KPI_Funnel_Events;

export function getKpiEventsForStage(stage: KpiFunnelStage): readonly string[] {
  return KPI_Funnel_Events[stage];
}
