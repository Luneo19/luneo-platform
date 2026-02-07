'use client';

import { Card, CardContent } from '@/components/ui/card';

interface PlaceholderTabProps {
  title: string;
  description?: string;
}

export function PlaceholderTab({ title, description }: PlaceholderTabProps) {
  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="py-12 text-center">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          {description && <p className="text-sm text-slate-400">{description}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
