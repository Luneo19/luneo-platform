'use client';

import React, { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ClipboardCheck, LifeBuoy, Shield, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type SharedQuotaPayload = {
  brandId: string;
  plan: string;
  overage: number;
  recommendation: string | null;
  pressure: {
    metric: string;
    percentage: number;
  } | null;
  timestamp: string;
  exp?: number;
};

const currencyFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});

function formatDate(value: string): string {
  const date = new Date(value);
  return date.toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
}

function buildInsights(data: SharedQuotaPayload) {
  const insights = [
    {
      id: 'overage',
      label: 'Dépassement estimé',
      value: currencyFormatter.format((data.overage ?? 0) / 100),
      tone: 'rose',
      description:
        'Montant prévisionnel à facturer en fin de période si aucune action correctrice n\'est lancée.',
    },
    {
      id: 'plan',
      label: 'Plan actuel',
      value: data.plan,
      tone: 'indigo',
      description: 'Capacité contractuelle utilisée pour ce snapshot.',
    },
    {
      id: 'recommendation',
      label: 'Plan recommandé',
      value: data.recommendation ?? 'Plan actuel suffisant',
      tone: data.recommendation ? 'amber' : 'emerald',
      description: data.recommendation
        ? 'Upgrade conseillé pour absorber la pression sur les métriques critiques.'
        : 'Aucune action urgente identifiée.',
    },
  ];

  return insights;
}

function buildActions(data: SharedQuotaPayload) {
  const actions = [
    {
      id: 'monitor',
      title: 'Surveiller les alertes',
      detail:
        'Activez les notifications Slack / Email pour être prévenu dès que le quota franchit 90 %.',
    },
    {
      id: 'topup',
      title: 'Planifier un top-up',
      detail:
        'Lancez un achat ponctuel de crédits pour absorber les pics sans attendre la prochaine facturation.',
    },
    {
      id: 'upgrade',
      title: 'Comparer les plans',
      detail:
        'Analysez les packs Business / Enterprise pour sécuriser votre croissance sans surcharge.',
    },
  ];

  if (!data.recommendation) {
    actions.push({
      id: 'automation',
      title: 'Automatiser les redémarrages',
      detail:
        'Configurez des remises à zéro automatiques ou des triggers internes lorsque la pression retombe.',
    });
  }

  return actions;
}

interface QuotaShareClientProps {
  sharedData: SharedQuotaPayload;
}

function QuotaShareClientContent({ sharedData }: QuotaShareClientProps) {
  const insights = buildInsights(sharedData);
  const actions = buildActions(sharedData);
  const pressurePercentage = sharedData.pressure?.percentage ?? 0;

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-black text-white px-6 py-12">
      <div className="mx-auto max-w-5xl space-y-10">
        <header className="space-y-6">
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <Badge variant="outline" className="uppercase tracking-wide border-violet-500/40 text-violet-200">
              Snapshot partagé
            </Badge>
            <span>Généré le {formatDate(sharedData.timestamp)}</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-3xl sm:text-4xl font-semibold">
              Santé des quotas — {sharedData.brandId}
            </h1>
            <p className="text-gray-400 max-w-3xl">
              Visualisation read-only générée depuis le cockpit Luneo. Utilisez ce rapport pour coordonner les actions
              avec vos interlocuteurs (CSM, finance, opérations) sans devoir vous connecter.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild variant="outline" className="border-gray-700 text-gray-200">
              <Link href="/analytics">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Ouvrir le dashboard complet
              </Link>
            </Button>
            <Button asChild className="bg-gradient-to-r from-violet-500 to-indigo-500">
              <Link href="/contact">
                <LifeBuoy className="mr-2 h-4 w-4" />
                Planifier un accompagnement
              </Link>
            </Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {insights.map((insight) => (
            <Card
              key={insight.id}
              className={cn(
                'h-full border border-gray-800/60 bg-gray-900/60 p-5 shadow-lg',
                insight.tone === 'rose' && 'border-rose-500/30',
                insight.tone === 'amber' && 'border-amber-500/30',
                insight.tone === 'emerald' && 'border-emerald-500/30',
                insight.tone === 'indigo' && 'border-indigo-500/30',
              )}
            >
              <p className="text-xs uppercase text-gray-400">{insight.label}</p>
              <p className="mt-3 text-2xl font-semibold">{insight.value}</p>
              <p className="mt-2 text-sm text-gray-400">{insight.description}</p>
            </Card>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3 border-gray-800 bg-gray-900/60 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Pression maximale</p>
                <h2 className="text-xl font-semibold">
                  {sharedData.pressure ? sharedData.pressure.metric : 'Aucune métrique critique'}
                </h2>
              </div>
              <Badge
                className={cn(
                  'text-xs',
                  pressurePercentage >= 95
                    ? 'bg-rose-500/20 text-rose-200'
                    : pressurePercentage >= 80
                      ? 'bg-amber-500/20 text-amber-200'
                      : 'bg-emerald-500/20 text-emerald-200',
                )}
              >
                {pressurePercentage.toFixed(0)}%
              </Badge>
            </div>
            <Progress value={pressurePercentage} className="h-3" />
            <p className="text-xs text-gray-500">
              Cette valeur correspond à la donnée au moment du partage. Les données live sont accessibles depuis le
              cockpit sécurisé.
            </p>
            <div className="rounded-lg border border-gray-800/70 bg-gray-950/50 p-4 text-sm text-gray-300 leading-relaxed">
              <p className="font-semibold text-white mb-2">Recommandation</p>
              {sharedData.recommendation ? (
                <p>
                  Passer sur <strong>{sharedData.recommendation}</strong> pour gagner de la marge et réduire les coûts
                  de dépassement.
                </p>
              ) : (
                <p>Aucune montée en plan n'est requise. Continuez à surveiller vos alertes.</p>
              )}
            </div>
          </Card>
          <Card className="lg:col-span-2 border-gray-800 bg-gray-900/60 p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Sparkles className="h-4 w-4 text-violet-300" />
              Actions rapides
            </div>
            <div className="space-y-3">
              {actions.map((action) => (
                <div
                  key={action.id}
                  className="rounded-lg border border-gray-800/60 bg-gray-950/60 px-4 py-3 text-sm text-gray-300"
                >
                  <p className="font-medium text-white">{action.title}</p>
                  <p className="text-gray-400">{action.detail}</p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <Card className="border-gray-800 bg-gray-900/60 p-6 space-y-4">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <ClipboardCheck className="h-4 w-4 text-emerald-300" />
              Checklist partagée
            </div>
            <ul className="space-y-3 text-sm text-gray-300">
              <li className="flex gap-3">
                <span className="text-emerald-400">•</span>
                Valider la cohérence des métriques sur `/analytics` (section Usage & quotas).
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400">•</span>
                S'assurer que les alertes Slack / Email sont activées pour le brand {sharedData.brandId}.
              </li>
              <li className="flex gap-3">
                <span className="text-emerald-400">•</span>
                Partager ce snapshot aux équipes Finance & Opérations pour validation.
              </li>
            </ul>
          </Card>
          <Card className="border-gray-800 bg-gray-900/60 p-6 space-y-4">
            <p className="text-sm text-gray-400">Envie de plus de détails ?</p>
            <p className="text-gray-300 text-sm leading-relaxed">
              Le cockpit complet vous permet d'accéder au timeline d'alertes, aux projections basées sur la vélocité et
              au simulateur de top-up connecté à Stripe. Vous pouvez également déclencher un export PDF ou un lien
              partageable à tout moment.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline" className="border-gray-700 text-gray-200">
                <Link href="/pricing">Comparer les plans</Link>
              </Button>
              <Button asChild>
                <Link href="/analytics">Ouvrir le cockpit sécurisé</Link>
              </Button>
            </div>
          </Card>
        </section>
      </div>
    </main>
  );
}

const QuotaShareClientContentMemo = memo(QuotaShareClientContent);

export function QuotaShareClient({ sharedData }: QuotaShareClientProps) {
  return (
    <ErrorBoundary componentName="QuotaShareClient">
      <QuotaShareClientContentMemo sharedData={sharedData} />
    </ErrorBoundary>
  );
}

