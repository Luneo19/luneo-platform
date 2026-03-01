'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AnalyticsReportsDashboardPage() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Rapports Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Historique des rapports quotidiens, hebdomadaires et mensuels.
        </p>
      </header>

      <Card className="p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Rapport hebdomadaire</p>
            <p className="text-sm text-muted-foreground">Semaine courante - pret a telecharger</p>
          </div>
          <Button size="sm">Telecharger</Button>
        </div>
      </Card>
    </main>
  );
}
