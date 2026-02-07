'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { PlanDefinition } from './types';
import { formatCurrency } from './utils';

interface UsageQuotaRecommendedPlanCardProps {
  recommendedPlan: PlanDefinition | null;
}

export function UsageQuotaRecommendedPlanCard({ recommendedPlan }: UsageQuotaRecommendedPlanCardProps) {
  return (
    <Card className="border-gray-800 bg-gradient-to-b from-violet-950/60 via-gray-950 to-gray-900 p-6 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-violet-200 flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Pilotage pro
          </p>
          <h3 className="text-xl text-white font-semibold">
            {recommendedPlan ? 'Plan recommandé' : 'Plan optimisé'}
          </h3>
          <p className="text-sm text-violet-100/70">
            {recommendedPlan
              ? `Passez sur ${recommendedPlan.name} pour absorber vos pics critiques.`
              : 'Votre plan couvre confortablement vos usages actuels.'}
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {recommendedPlan ? 'Upgrade conseillé' : 'OK'}
        </Badge>
      </div>

      {recommendedPlan && (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 space-y-2 text-sm text-violet-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase text-violet-200/80">Plan cible</p>
              <p className="text-lg font-semibold">{recommendedPlan.name}</p>
            </div>
            <p className="text-sm font-medium">
              {formatCurrency(recommendedPlan.basePriceCents)}
            </p>
          </div>
          <ul className="space-y-1 text-xs text-violet-100/80">
            <li>• Jusqu'à 3x plus de capacité sur les métriques critiques.</li>
            <li>• Support prioritaire et quotas API élargis.</li>
            <li>• Déploiement instantané côté backend (aucune coupure).</li>
          </ul>
        </div>
      )}

      <div className="flex gap-2">
        <Button asChild className="flex-1">
          <Link href="/pricing">
            Comparer les plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">Parler à un expert</Link>
        </Button>
      </div>
    </Card>
  );
}
