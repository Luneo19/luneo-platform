'use client';

import { Card } from '@/components/ui/card';

export default function KnowledgeTrainingPage() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Training Data</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des signaux d&apos;apprentissage, corrections humaines et donnees d&apos;amelioration.
        </p>
      </header>

      <Card className="p-5">
        <p className="text-sm text-muted-foreground">
          Vue de supervision des signaux `resolved_by_ai`, `human_correction`, `knowledge_gap`.
        </p>
      </Card>
    </main>
  );
}
