'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function AssignmentRulesPage() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Regles d&apos;assignation</h1>
        <p className="text-sm text-muted-foreground">
          Definir les regles automatiques d&apos;assignation des conversations escaladees.
        </p>
      </header>

      <Card className="p-5 space-y-3">
        <p className="text-sm text-muted-foreground">
          Exemple: si `intent=complaint` et `sentiment=urgent`, assigner a Team Support L2.
        </p>
        <Button>Creer une regle</Button>
      </Card>
    </main>
  );
}
