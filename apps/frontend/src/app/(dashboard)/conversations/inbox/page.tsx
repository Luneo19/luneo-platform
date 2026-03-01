'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const FILTERS = ['Assigned to me', 'Unassigned', 'Escalated', 'All channels', 'High priority'];

export default function ConversationsInboxPage() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Team Inbox</h1>
        <p className="text-sm text-muted-foreground">
          Centre de traitement collaboratif des conversations escaladees.
        </p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => (
          <Button key={filter} variant="outline" size="sm">
            {filter}
          </Button>
        ))}
      </div>

      <Card className="p-5">
        <p className="text-sm text-muted-foreground">
          Branchez cette vue aux endpoints d&apos;assignation, notes internes et SLA pour une inbox temps reel.
        </p>
      </Card>
    </main>
  );
}
