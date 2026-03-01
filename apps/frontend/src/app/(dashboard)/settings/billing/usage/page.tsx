'use client';

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

const USAGE = [
  { label: 'Conversations', value: 21 },
  { label: 'Contacts', value: 37 },
  { label: 'Knowledge chunks', value: 47 },
  { label: 'Tokens LLM', value: 24 },
];

export default function BillingUsagePage() {
  return (
    <main className="space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Usage du plan</h1>
        <p className="text-sm text-muted-foreground">
          Suivi des quotas et consommation mensuelle en temps reel.
        </p>
      </header>

      <div className="grid gap-4">
        {USAGE.map((item) => (
          <Card key={item.label} className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{item.label}</span>
              <span>{item.value}%</span>
            </div>
            <Progress value={item.value} className="h-2" />
          </Card>
        ))}
      </div>
    </main>
  );
}
