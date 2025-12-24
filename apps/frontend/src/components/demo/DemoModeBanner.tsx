'use client';

import React, { useState, useCallback, memo } from 'react';
import { AlertTriangle, PlayCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoMode } from '@/hooks/useDemoMode';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DemoModeBannerContent() {
  const { isDemoMode, disableDemo } = useDemoMode();
  const [dismissed, setDismissed] = useState(false);

  const handleDisable = useCallback(() => {
    disableDemo();
    setDismissed(true);
  }, [disableDemo]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  if (!isDemoMode || dismissed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/40 bg-amber-500/10 p-6 text-sm text-amber-100 shadow-lg">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-full border border-amber-400/40 bg-amber-500/20 p-2">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-amber-100">Mode Démo activé</p>
            <p className="mt-1 text-amber-100/80">
              Vous visualisez une expérience commerciale avec des données anonymisées et des
              scénarios guidés. Retournez en mode production pour reprendre vos métriques réelles.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
                Sales demo
              </span>
              <span className="inline-flex items-center rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
                Données anonymisées
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button
            onClick={handleDisable}
            variant="outline"
            className="border-amber-400/60 text-amber-100 hover:bg-amber-500/20 hover:text-white"
          >
            <PlayCircle className="mr-2 h-4 w-4" />
            Quitter le mode démo
          </Button>
          <button
            type="button"
            onClick={handleDismiss}
            className="flex items-center gap-1 text-xs text-amber-100/70 hover:text-amber-50"
          >
            <X className="h-3.5 w-3.5" />
            Masquer pour cette session
          </button>
        </div>
      </div>
    </div>
  );
}

const DemoModeBannerContentMemo = memo(DemoModeBannerContent);

export function DemoModeBanner() {
  return (
    <ErrorBoundary componentName="DemoModeBanner">
      <DemoModeBannerContentMemo />
    </ErrorBoundary>
  );
}

