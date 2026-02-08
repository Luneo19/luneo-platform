'use client';

import React from 'react';
import { useDashboardStore } from '@/store/dashboard.store';
import { useIndustryStore } from '@/store/industry.store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DashboardHeader() {
  const { currentIndustry } = useIndustryStore();
  const { toggleCustomizing, isCustomizing } = useDashboardStore();
  const [userName, setUserName] = React.useState<string>('');

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr) as { firstName?: string; name?: string; email?: string };
        setUserName(user?.firstName || user?.name || '');
      }
    } catch {
      // ignore
    }
  }, []);

  const accentColor = currentIndustry?.accentColor ?? '#6366f1';
  const industryLabel = currentIndustry?.labelFr || currentIndustry?.labelEn || '';

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-white">
          Bonjour{userName ? `, ${userName}` : ''}
        </h1>
        <p className="text-slate-400 mt-1">
          Vue d&apos;ensemble de votre activité
        </p>
        {industryLabel && (
          <Badge
            className="mt-2 border-0 text-white"
            style={{ backgroundColor: accentColor }}
          >
            {industryLabel}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={isCustomizing ? 'default' : 'outline'}
          size="sm"
          className={cn(
            isCustomizing
              ? 'bg-slate-600 hover:bg-slate-500'
              : 'border-slate-600 text-slate-300 hover:bg-slate-800 hover:text-white'
          )}
          onClick={toggleCustomizing}
        >
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          Personnaliser
        </Button>
      </div>
    </div>
  );
}
