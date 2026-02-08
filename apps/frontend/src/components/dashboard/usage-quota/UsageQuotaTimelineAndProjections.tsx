'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { PlanDefinition } from './types';
import type { TimelineEntry, ProjectionHighlight } from './types';
import {
  timelineSeverityDot,
  projectionStatusBadge,
  projectionStatusLabel,
} from './constants';
import { formatNumber, formatDaysToLimit, getMetricUnit } from './utils';

interface UsageQuotaTimelineAndProjectionsProps {
  timelineEntries: TimelineEntry[];
  projectionHighlights: ProjectionHighlight[];
  effectivePlan: PlanDefinition;
}

export function UsageQuotaTimelineAndProjections({
  timelineEntries,
  projectionHighlights,
  effectivePlan,
}: UsageQuotaTimelineAndProjectionsProps) {
  return (
    <Card className="lg:col-span-2 border-gray-800 bg-gray-900/50 p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-400">Alertes & événements</p>
          <h3 className="text-lg text-white font-semibold">Surveillance temps réel</h3>
        </div>
        <Badge variant="outline">{timelineEntries.length} évènement(s)</Badge>
      </div>
      <ScrollArea className="h-[240px] pr-2">
        <div className="space-y-6">
          {timelineEntries.map((entry, index) => (
            <div className="flex gap-3" key={entry.id}>
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    'h-3 w-3 rounded-full border-2',
                    timelineSeverityDot[entry.severity],
                  )}
                />
                {index !== timelineEntries.length - 1 && (
                  <div className="w-px flex-1 bg-gray-800" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <p className="text-white font-medium">{entry.title}</p>
                  <span className="text-xs text-gray-500">{entry.timestampLabel}</span>
                </div>
                <p className="text-sm text-gray-400">{entry.description}</p>
                <p className="text-xs text-gray-500">{entry.absoluteDate}</p>
                {entry.suggestion && (
                  <p className="text-xs text-indigo-200">
                    Suggestion · {entry.suggestion}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div>
        <p className="text-sm text-gray-400 mb-3">Projections sur la période</p>
        <div className="grid gap-3 md:grid-cols-2">
          {projectionHighlights.slice(0, 4).map((highlight) => (
            <div
              key={highlight.id}
              className="rounded-lg border border-gray-800 bg-gray-900/60 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase text-gray-500">{highlight.label}</p>
                  <p className="text-lg text-white font-semibold">
                    {Number.isFinite(highlight.projectedPercentage)
                      ? `${highlight.projectedPercentage.toFixed(0)}%`
                      : 'Stable'}
                  </p>
                </div>
                <Badge variant={projectionStatusBadge[highlight.status]}>
                  {projectionStatusLabel[highlight.status]}
                </Badge>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-4 text-xs text-gray-400">
                <div>
                  <p>Rythme quotidien</p>
                  <p className="text-sm text-white font-medium">
                    {formatNumber(highlight.dailyRate)} {getMetricUnit(highlight.metric, effectivePlan)}/j
                  </p>
                </div>
                <div>
                  <p>Atteindra la limite</p>
                  <p className="text-sm text-white font-medium">
                    {formatDaysToLimit(highlight.daysToLimit)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
