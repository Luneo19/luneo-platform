'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { Lock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePlanGate } from '@/lib/hooks/api/useFeatureGate';
import type { PlanTier } from '@/lib/hooks/api/useSubscription';

const PLAN_BADGE: Record<PlanTier, string> = {
  free: 'FREE',
  starter: 'STARTER',
  professional: 'PRO',
  business: 'BUSINESS',
  enterprise: 'ENTERPRISE',
};

const PLAN_NAME: Record<PlanTier, string> = {
  free: 'Free',
  starter: 'Starter',
  professional: 'Professional',
  business: 'Business',
  enterprise: 'Enterprise',
};

export interface SoftPlanGateProps {
  minimumPlan: PlanTier;
  featureName: string;
  children: ReactNode;
}

/**
 * Soft plan gate: shows content grayed out with an overlay when user doesn't have access.
 * Clicking the overlay opens an upgrade modal / navigates to billing.
 */
export function SoftPlanGate({ minimumPlan, featureName, children }: SoftPlanGateProps) {
  const { hasAccess, isLoading } = usePlanGate(minimumPlan);
  const [modalOpen, setModalOpen] = useState(false);

  const planBadge = PLAN_BADGE[minimumPlan];
  const planName = PLAN_NAME[minimumPlan];

  if (isLoading) {
    return <div className="animate-pulse rounded-xl bg-white/[0.03] min-h-[120px]">{children}</div>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-xl">
      {/* Content: grayed out and non-interactive */}
      <div className="opacity-60 pointer-events-none select-none rounded-xl">
        {children}
      </div>

      {/* Overlay: glass-morphism, clickable */}
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-black/40 backdrop-blur-sm border border-white/10 text-left cursor-pointer hover:bg-black/50 transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-offset-2 focus:ring-offset-[#0a0a0f]"
        aria-label={`Débloquer ${featureName} avec le plan ${planName}`}
      >
        <div className="flex flex-col items-center gap-3 p-6 max-w-sm text-center">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
            <Lock className="w-6 h-6 text-white/80" />
          </div>
          <span className="text-[10px] font-semibold tracking-wider px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
            {planBadge}
          </span>
          <p className="text-sm text-white/90">
            Fonctionnalité disponible avec le plan {planName}
          </p>
          <span className="text-xs text-white/60">
            Cliquez pour passer au plan {planName}
          </span>
        </div>
      </button>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="dash-card border-white/10 bg-[#12121a] text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-400" />
              Débloquer {featureName}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-white/80">
              {featureName} est disponible à partir du plan <strong className="text-purple-400">{planName}</strong>.
              Mettez à niveau votre abonnement pour accéder à cette fonctionnalité.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                asChild
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white border-0"
              >
                <Link href="/dashboard/billing" onClick={() => setModalOpen(false)}>
                  Passer au plan {planName}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                className="border-white/20 text-white/80 hover:bg-white/10"
                onClick={() => setModalOpen(false)}
              >
                Plus tard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
