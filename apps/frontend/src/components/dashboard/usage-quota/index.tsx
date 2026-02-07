'use client';

import { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { UsageQuotaOverview } from './UsageQuotaOverview';

export { UsageQuotaOverview } from './UsageQuotaOverview';
export type { UsageSummaryData, TimelineEntry, ProjectionHighlight, PlanCoverageInsight, TopUpSimulation } from './types';

const UsageQuotaOverviewMemo = memo(UsageQuotaOverview);

export default function UsageQuotaOverviewWrapper() {
  return (
    <ErrorBoundary componentName="UsageQuotaOverview">
      <UsageQuotaOverviewMemo />
    </ErrorBoundary>
  );
}
