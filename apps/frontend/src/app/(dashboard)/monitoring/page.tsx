'use client';

import { Suspense, memo } from 'react';
import ObservabilityDashboard from '@/components/dashboard/ObservabilityDashboard';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function MonitoringPageContent() {
  return (
    <div className="space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>
        <ObservabilityDashboard />
      </Suspense>
    </div>
  );
}

const MemoizedMonitoringPageContent = memo(MonitoringPageContent);

export default function MonitoringPage() {
  return (
    <ErrorBoundary level="page" componentName="MonitoringPage">
      <MemoizedMonitoringPageContent />
    </ErrorBoundary>
  );
}

