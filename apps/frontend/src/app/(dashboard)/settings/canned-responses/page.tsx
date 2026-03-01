'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CannedResponsesPage() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Reponses pre-enregistrees</h1>
        <p className="text-sm text-muted-foreground">
          Gerer vos macros et raccourcis pour le human takeover.
        </p>
      </header>

      <Card className="p-5 space-y-3">
        <Input placeholder="Titre (ex: Politique retour)" />
        <Input placeholder="Raccourci (ex: /retour)" />
        <Button>Ajouter une macro</Button>
      </Card>
    </main>
  );
}
