'use client';

import React from 'react';
import { BarChart3, Flame } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface OptionHeatmapProps {
  options?: { componentId: string; componentName?: string; optionId: string; optionName?: string; count: number; percentage?: number }[];
  className?: string;
}

export function OptionHeatmap({ options = [], className }: OptionHeatmapProps) {
  const maxCount = Math.max(...options.map((o) => o.count), 1);

  const byComponent = options.reduce<Record<string, typeof options>>((acc, o) => {
    const key = o.componentName ?? o.componentId;
    if (!acc[key]) acc[key] = [];
    acc[key].push(o);
    return acc;
  }, {});

  const sortedComponents = Object.entries(byComponent).map(([name, opts]) => ({
    name,
    options: opts.sort((a, b) => b.count - a.count),
  }));

  return (
    <Card className={cn(className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-primary" />
          Option Popularity
        </CardTitle>
        <CardDescription>
          Most selected options by component
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {sortedComponents.length === 0 ? (
            <p className="text-center text-muted-foreground">No option data yet</p>
          ) : (
            sortedComponents.map((comp) => (
              <div key={comp.name} className="space-y-2">
                <p className="text-sm font-medium">{comp.name}</p>
                <div className="space-y-2">
                  {comp.options.map((opt) => {
                    const pct = (opt.count / maxCount) * 100;
                    const intensity = Math.min(100, pct * 1.5);
                    return (
                      <div key={opt.optionId} className="flex items-center gap-3">
                        <span className="w-32 truncate text-sm">
                          {opt.optionName ?? opt.optionId}
                        </span>
                        <div className="flex-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-6 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              opacity: 0.5 + intensity / 200,
                            }}
                          />
                        </div>
                        <span className="w-16 text-right text-sm text-muted-foreground">
                          {opt.count} ({opt.percentage?.toFixed(1) ?? '-'}%)
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
