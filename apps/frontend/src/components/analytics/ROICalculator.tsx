'use client';

import { Card } from '@/components/ui/card';

export function ROICalculator() {
  return (
    <Card className="p-4 space-y-2">
      <p className="font-medium">ROI Calculator</p>
      <p className="text-sm text-muted-foreground">
        (Conversations IA x cout ticket) + (Leads qualifies x conversion x panier) - cout Luneo
      </p>
    </Card>
  );
}
