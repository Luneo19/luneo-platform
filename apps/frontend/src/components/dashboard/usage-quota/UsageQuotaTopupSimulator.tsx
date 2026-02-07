'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import type { PlanDefinition } from './types';
import type { UsageSummaryData } from './types';
import type { TopUpSimulation } from './types';
import type { PlanQuotaDefinition } from './types';
import { formatCurrency, getQuotaLabel } from './utils';

interface UsageQuotaTopupSimulatorProps {
  effectiveSummary: UsageSummaryData;
  effectivePlan: PlanDefinition;
  topupMetric: string | null;
  topupUnits: number;
  topupTargetQuota: PlanQuotaDefinition | null;
  topupSliderMax: number;
  topupSliderStep: number;
  topupSimulation: TopUpSimulation | null;
  topupSimulationLoading: boolean;
  topupSimulationSource: 'backend' | 'local';
  topupSimulationError: string | null;
  topupCheckoutLoading: boolean;
  onSetTopupMetric: (value: string) => void;
  onSetTopupUnits: (value: number) => void;
  onTopupCheckout: () => void;
  formatDaysToLimit: (days: number) => string;
}

export function UsageQuotaTopupSimulator({
  effectiveSummary,
  effectivePlan,
  topupMetric,
  topupUnits,
  topupTargetQuota,
  topupSliderMax,
  topupSliderStep,
  topupSimulation,
  topupSimulationLoading,
  topupSimulationSource,
  topupSimulationError,
  topupCheckoutLoading,
  onSetTopupMetric,
  onSetTopupUnits,
  onTopupCheckout,
  formatDaysToLimit,
}: UsageQuotaTopupSimulatorProps) {
  return (
    <Card className="border-gray-800 bg-gray-900/60 p-6 space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-gray-400">Simulateur de top-up</p>
          <h3 className="text-lg text-white font-semibold">
            Ajoutez des crédits et visualisez l'impact instantanément
          </h3>
        </div>
        <Badge variant="outline" className="text-xs">
          Beta
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs uppercase text-gray-400">Métrique à renforcer</Label>
          <Select
            value={topupMetric ?? undefined}
            onValueChange={(value) => {
              onSetTopupMetric(value);
              onSetTopupUnits(0);
            }}
          >
            <SelectTrigger className="bg-gray-900 border-gray-800 text-white">
              <SelectValue placeholder="Choisissez une métrique" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-gray-800 text-white">
              {effectiveSummary.metrics.map((metric) => (
                <SelectItem key={metric.type} value={metric.type}>
                  {getQuotaLabel(metric.type, effectivePlan)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-xs uppercase text-gray-400">Crédits supplémentaires</Label>
          <div className="flex items-center gap-3">
            <Slider
              value={[topupUnits]}
              min={0}
              step={topupSliderStep}
              max={topupSliderMax}
              onValueChange={(values) => onSetTopupUnits(Math.max(0, values[0] ?? 0))}
              className="flex-1"
            />
            <Input
              type="number"
              className="w-24 bg-gray-900 border-gray-800 text-white"
              value={topupUnits}
              min={0}
              onChange={(event) => {
                const next = Number(event.target.value);
                onSetTopupUnits(Number.isNaN(next) ? 0 : Math.max(0, next));
              }}
            />
          </div>
          {topupTargetQuota && (
            <p className="text-xs text-gray-500">
              Base plan : {topupTargetQuota.limit.toLocaleString()} {topupTargetQuota.unit}
              {' · '}
              Simulation max : {topupSliderMax.toLocaleString()} {topupTargetQuota.unit}
            </p>
          )}
          <p className="text-xs text-gray-500">
            {topupSimulationLoading
              ? 'Simulation backend en cours…'
              : topupSimulationSource === 'backend'
                ? 'Projection validée côté backend.'
                : 'Projection locale — augmentez les crédits pour déclencher la simulation API.'}
          </p>
          {topupSimulationError && (
            <p className="text-xs text-amber-200">{topupSimulationError}</p>
          )}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-800 bg-gray-950/70 p-4">
          <p className="text-xs uppercase text-gray-400">Pression projetée</p>
          {topupSimulation ? (
            <>
              <p className="mt-2 text-2xl text-white font-semibold">
                {topupSimulation.simulatedPercentage.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500">
                Actuel : {topupSimulation.originalPercentage.toFixed(0)}%
              </p>
              <p className="text-xs text-gray-500">{topupSimulation.metricLabel}</p>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Sélectionnez une métrique.</p>
          )}
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-950/70 p-4">
          <p className="text-xs uppercase text-gray-400">Horizon supplémentaire</p>
          {topupSimulation ? (
            <>
              <p className="mt-2 text-2xl text-white font-semibold">
                {topupSimulation.simulatedDaysToLimit
                  ? formatDaysToLimit(topupSimulation.simulatedDaysToLimit)
                  : 'Stable'}
              </p>
              <p className="text-xs text-gray-500">
                Avant :{' '}
                {topupSimulation.originalDaysToLimit
                  ? formatDaysToLimit(topupSimulation.originalDaysToLimit)
                  : 'Stable'}
              </p>
              {topupSimulation.regainedDays !== null &&
                Number.isFinite(topupSimulation.regainedDays) &&
                topupSimulation.regainedDays > 0 && (
                  <p className="text-xs text-emerald-300">
                    +{topupSimulation.regainedDays.toFixed(1)} jour(s) de marge
                  </p>
                )}
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Ajustez votre top-up.</p>
          )}
        </div>
        <div className="rounded-lg border border-gray-800 bg-gray-950/70 p-4">
          <p className="text-xs uppercase text-gray-400">Investissement estimé</p>
          {topupSimulation ? (
            <>
              <p className="mt-2 text-2xl text-white font-semibold">
                {topupSimulation.estimatedCostCents !== null
                  ? formatCurrency(topupSimulation.estimatedCostCents)
                  : 'Gratuit'}
              </p>
              <p className="text-xs text-gray-500">
                {topupTargetQuota?.overageRate
                  ? `${formatCurrency(topupTargetQuota.overageRate)} / ${topupTargetQuota.unit}`
                  : 'Aucun tarif unitaire défini'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-sm text-gray-500">Sélectionnez une métrique.</p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-gray-400">
          {topupMetric && topupUnits > 0
            ? `Prêt à ajouter ${topupUnits.toLocaleString()} ${topupSimulation?.unit ?? ''} sur ${getQuotaLabel(
                topupMetric,
                effectivePlan,
              )}`
            : 'Définissez une simulation pour accéder au paiement Stripe.'}
        </div>
        <Button
          onClick={() => {
            void onTopupCheckout();
          }}
          disabled={!topupMetric || topupUnits <= 0 || topupCheckoutLoading}
        >
          {topupCheckoutLoading ? 'Création en cours...' : 'Acheter ce top-up'}
        </Button>
      </div>
    </Card>
  );
}
