'use client';

import React from 'react';
import { TrendingDown, Users, Settings, Save, ShoppingCart, Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

const STEP_ICONS: Record<string, React.ElementType> = {
  opened: Users,
  configured: Settings,
  saved: Save,
  'added-to-cart': ShoppingCart,
  purchased: Check,
};

const STEP_COLORS = [
  'bg-emerald-500',
  'bg-teal-500',
  'bg-cyan-500',
  'bg-amber-500',
  'bg-orange-500',
];

export interface ConversionFunnelProps {
  steps?: { step: string; count: number; rate?: number }[];
  className?: string;
}

const DEFAULT_STEPS = [
  { step: 'Opened', count: 0, rate: 100 },
  { step: 'Configured', count: 0, rate: 0 },
  { step: 'Saved', count: 0, rate: 0 },
  { step: 'Added to Cart', count: 0, rate: 0 },
  { step: 'Purchased', count: 0, rate: 0 },
];

export function ConversionFunnel({ steps = [], className }: ConversionFunnelProps) {
  const data = steps.length > 0 ? steps : DEFAULT_STEPS;
  const maxCount = Math.max(...data.map((s) => s.count), 1);

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Conversion Funnel
        </CardTitle>
        <CardDescription>
          User journey from open to purchase
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, i) => {
            const width = maxCount > 0 ? (item.count / maxCount) * 100 : 0;
            const IconComponent = (STEP_ICONS[item.step.toLowerCase().replace(/\s+/g, '-')] ?? Users) as React.ComponentType<{ className?: string }>;
            return (
              <div key={item.step} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{item.step}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{item.count.toLocaleString()}</span>
                    {item.rate != null && (
                      <span className="font-medium">{item.rate.toFixed(1)}%</span>
                    )}
                  </div>
                </div>
                <div className="h-8 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      'h-full rounded-full transition-all duration-500',
                      STEP_COLORS[i % STEP_COLORS.length] as string
                    )}
                    style={{ width: `${Math.max(width, 2)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
