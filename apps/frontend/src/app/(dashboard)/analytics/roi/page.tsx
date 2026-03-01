'use client';

import { Card } from '@/components/ui/card';

export default function AnalyticsRoiPage() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">ROI Temps Reel</h1>
        <p className="text-sm text-muted-foreground">
          Visualisation de la formule ROI par verticale, avec decomposition gains/couts.
        </p>
      </header>

      <Card className="p-5 space-y-2">
        <p className="font-medium">Formule active</p>
        <p className="text-sm text-muted-foreground">
          (Conversations resolues IA x cout ticket humain) + (Leads qualifies x conversion x panier) - cout Luneo
        </p>
      </Card>
    </main>
  );
}
