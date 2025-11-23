import { Suspense } from 'react';
import { ObservabilityDashboard } from '@/components/dashboard/ObservabilityDashboard';

export default function MonitoringPage() {
  return (
    <div className="space-y-6 px-4 pb-12 pt-6 sm:px-6 lg:px-10">
      <Suspense fallback={<div className="text-sm text-muted-foreground">Chargement…</div>}>
        <ObservabilityDashboard />
      </Suspense>
    </div>
  );
}

