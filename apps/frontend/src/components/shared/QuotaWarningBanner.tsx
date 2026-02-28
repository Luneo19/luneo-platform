'use client';

import { AlertTriangle, ArrowRight, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useQuotaGate } from '@/lib/hooks/api/useFeatureGate';

type QuotaMetric = 'designs' | 'renders2D' | 'renders3D' | 'storage' | 'apiCalls' | 'teamMembers';

interface QuotaWarningBannerProps {
  metric: QuotaMetric;
  /** Show when remaining is below this percentage (0-1). Default 0.2 (20%) */
  threshold?: number;
  className?: string;
}

const METRIC_LABELS: Record<QuotaMetric, { singular: string; plural: string; unit?: string }> = {
  designs: { singular: 'design', plural: 'designs' },
  renders2D: { singular: 'rendu 2D', plural: 'rendus 2D' },
  renders3D: { singular: 'rendu 3D', plural: 'rendus 3D' },
  storage: { singular: 'Go', plural: 'Go', unit: 'Go' },
  apiCalls: { singular: 'appel API', plural: 'appels API' },
  teamMembers: { singular: 'membre', plural: 'membres' },
};

export function QuotaWarningBanner({
  metric,
  threshold = 0.2,
  className = '',
}: QuotaWarningBannerProps) {
  const { limit, currentUsage, remaining, isLoading } = useQuotaGate(metric);

  if (isLoading || limit === Infinity || limit === 0) return null;

  const usagePercentage = limit > 0 ? currentUsage / limit : 0;
  const remainingPercentage = limit > 0 ? remaining / limit : 1;

  // Don't show if above threshold
  if (remainingPercentage > threshold) return null;

  const labels = METRIC_LABELS[metric];
  const remainingLabel = remaining <= 1 ? labels.singular : labels.plural;
  const isExhausted = remaining <= 0;

  if (isExhausted) {
    return (
      <div className={`rounded-lg border border-red-200 bg-red-50 p-4 ${className}`}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-red-800">
                Limite atteinte
              </p>
              <p className="text-sm text-red-600">
                Vous avez utilisé {currentUsage}/{limit} {labels.plural} ce mois-ci.
                Passez au plan supérieur pour continuer.
              </p>
            </div>
          </div>
          <Link href="/pricing">
            <Button size="sm" variant="outline" className="shrink-0 border-red-300 text-red-700 hover:bg-red-100">
              Upgrade
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-amber-200 bg-amber-50 p-4 ${className}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {remaining} {remainingLabel} restant{remaining > 1 ? 's' : ''}
            </p>
            <p className="text-sm text-amber-600">
              {currentUsage}/{limit} utilises ce mois-ci ({Math.round(usagePercentage * 100)}%)
            </p>
          </div>
        </div>
        <Link href="/pricing">
          <Button size="sm" variant="outline" className="shrink-0 border-amber-300 text-amber-700 hover:bg-amber-100">
            Voir les plans
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
      {/* Progress bar */}
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-amber-200">
        <div
          className="h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${Math.min(usagePercentage * 100, 100)}%` }}
        />
      </div>
    </div>
  );
}
