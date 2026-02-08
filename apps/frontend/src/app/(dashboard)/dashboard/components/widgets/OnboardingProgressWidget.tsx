'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useDashboardStore } from '@/store/dashboard.store';
import { WidgetWrapper } from './WidgetWrapper';
import { Button } from '@/components/ui/button';
import { CheckCircle, Circle } from 'lucide-react';

const WIDGET_SLUG = 'onboarding-progress';

interface OnboardingStep {
  id: string;
  label: string;
  completed: boolean;
  href?: string;
}

interface OnboardingProgressData {
  steps?: OnboardingStep[];
  completedCount?: number;
  totalCount?: number;
  percentComplete?: number;
}

export function OnboardingProgressWidget() {
  const { widgetData, fetchWidgetData } = useDashboardStore();
  const data = widgetData[WIDGET_SLUG] as OnboardingProgressData | undefined;
  const isLoading = data === undefined && !Object.prototype.hasOwnProperty.call(widgetData, WIDGET_SLUG);

  useEffect(() => {
    fetchWidgetData(WIDGET_SLUG);
  }, [fetchWidgetData]);

  const steps = data?.steps ?? [];
  const hasData = steps.length > 0 || data?.totalCount !== undefined;
  const completed = data?.completedCount ?? steps.filter((s) => s.completed).length;
  const total = data?.totalCount ?? (steps.length || 1);
  const percent = data?.percentComplete ?? (total > 0 ? Math.round((completed / total) * 100) : 0);

  return (
    <WidgetWrapper
      title="Onboarding"
      subtitle="Complétez votre configuration"
      isLoading={isLoading}
      error={data === null ? 'Impossible de charger les données' : undefined}
    >
      {hasData && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="h-2 rounded-full bg-slate-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {completed}/{total} étapes ({percent}%)
              </p>
            </div>
          </div>
          {steps.length > 0 && (
            <ul className="space-y-2">
              {steps.map((step) => (
                <li key={step.id} className="flex items-center gap-2 text-sm">
                  {step.completed ? (
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  ) : (
                    <Circle className="h-4 w-4 text-slate-500 shrink-0" />
                  )}
                  {step.href ? (
                    <Link
                      href={step.href}
                      className="text-slate-300 hover:text-white truncate"
                    >
                      {step.label}
                    </Link>
                  ) : (
                    <span
                      className={step.completed ? 'text-slate-400' : 'text-slate-300'}
                    >
                      {step.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {percent < 100 && (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              asChild
            >
              <Link href="/dashboard/settings">Compléter la configuration</Link>
            </Button>
          )}
        </div>
      )}
      {!hasData && !isLoading && data !== undefined && (
        <p className="text-slate-500 text-sm">Aucune étape d&apos;onboarding.</p>
      )}
    </WidgetWrapper>
  );
}
