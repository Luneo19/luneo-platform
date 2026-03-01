'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function KnowledgeGapsPage() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Knowledge Gaps</h1>
        <p className="text-sm text-muted-foreground">
          Questions frequentes sans reponse fiable detectees par le moteur de learning.
        </p>
      </header>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Gap: delai livraison internationale</p>
            <p className="text-sm text-muted-foreground">Frequence: 37 occurrences cette semaine</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm">Approuver suggestion</Button>
            <Button variant="outline" size="sm">Modifier</Button>
          </div>
        </div>
      </Card>
    </main>
  );
}
