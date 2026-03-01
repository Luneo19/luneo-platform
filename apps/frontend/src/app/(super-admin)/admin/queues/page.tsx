'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const QUEUES = ['conversation', 'knowledge-indexing', 'learning', 'summarization', 'dead-letter-queue'];

export default function AdminQueuesPage() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Queue Monitoring</h1>
        <p className="text-sm text-muted-foreground">
          Supervision des files BullMQ, jobs en erreur et reprise manuelle.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        {QUEUES.map((queue) => (
          <Card key={queue} className="p-4 space-y-3">
            <p className="font-medium">{queue}</p>
            <p className="text-sm text-muted-foreground">En attente: 0 | En cours: 0 | Echecs: 0</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline">Retry fails</Button>
              <Button size="sm" variant="outline">Purger</Button>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
