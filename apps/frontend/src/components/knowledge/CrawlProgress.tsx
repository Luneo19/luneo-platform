'use client';

import { Progress } from '@/components/ui/progress';

interface CrawlProgressProps {
  value: number;
  pagesProcessed?: number;
  pagesTotal?: number;
}

export function CrawlProgress({ value, pagesProcessed, pagesTotal }: CrawlProgressProps) {
  return (
    <div className="space-y-2">
      <Progress value={value} className="h-2" />
      <p className="text-xs text-muted-foreground">
        {Math.round(value)}% - {pagesProcessed ?? 0}/{pagesTotal ?? 0} pages
      </p>
    </div>
  );
}
