'use client';

import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface UpgradeRequiredPageProps {
  feature: string;
  requiredPlan: string;
  description?: string;
}

export function UpgradeRequiredPage({
  feature,
  requiredPlan,
  description,
}: UpgradeRequiredPageProps) {
  const planLabel = requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="mx-auto max-w-md text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
          <Lock className="h-8 w-8 text-blue-600" />
        </div>
        <h2 className="mb-2 text-2xl font-bold text-gray-900">
          Fonctionnalite {planLabel}
        </h2>
        <p className="mb-6 text-gray-600">
          {description ||
            `${feature} est disponible a partir du plan ${planLabel}. Mettez a niveau votre abonnement pour debloquer cette fonctionnalite.`}
        </p>
        <div className="mb-6 rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center justify-center gap-2 text-sm font-medium text-blue-700">
            <Sparkles className="h-4 w-4" />
            <span>Inclus dans le plan {planLabel} et superieur</span>
          </div>
        </div>
        <Link href={`/pricing?plan=${requiredPlan}`}>
          <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
            Voir les plans
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}
