export type ScorecardMetricKey = 'arr' | 'nrr' | 'activation' | 'margin';

export interface ScorecardWeight {
  key: ScorecardMetricKey;
  label: string;
  weight: number;
}

export interface QuarterlyTarget {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  arrGrowthPct: number;
  nrrPct: number;
  activationPct: number;
  grossMarginPct: number;
}

export const SCORECARD_WEIGHTS: ScorecardWeight[] = [
  { key: 'arr', label: 'ARR', weight: 40 },
  { key: 'nrr', label: 'NRR', weight: 30 },
  { key: 'activation', label: 'Activation', weight: 20 },
  { key: 'margin', label: 'Marge', weight: 10 },
];

export const QUARTERLY_TARGETS: QuarterlyTarget[] = [
  { quarter: 'Q1', arrGrowthPct: 15, nrrPct: 108, activationPct: 45, grossMarginPct: 62 },
  { quarter: 'Q2', arrGrowthPct: 20, nrrPct: 112, activationPct: 52, grossMarginPct: 66 },
  { quarter: 'Q3', arrGrowthPct: 25, nrrPct: 116, activationPct: 58, grossMarginPct: 70 },
  { quarter: 'Q4', arrGrowthPct: 30, nrrPct: 120, activationPct: 65, grossMarginPct: 74 },
];

