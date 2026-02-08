'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface WidgetWrapperProps {
  title: string;
  subtitle?: string;
  isLoading?: boolean;
  error?: string | null;
  children: React.ReactNode;
  className?: string;
}

export function WidgetWrapper({
  title,
  subtitle,
  isLoading,
  error,
  children,
  className,
}: WidgetWrapperProps) {
  return (
    <Card
      className={cn(
        'bg-slate-800/50 border-slate-700 text-white overflow-hidden',
        className
      )}
    >
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-white">{title}</CardTitle>
        {subtitle && (
          <CardDescription className="text-slate-400 text-sm">
            {subtitle}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 py-3 px-4 text-sm">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {!error && isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full rounded-lg bg-slate-700/50" />
            <Skeleton className="h-20 w-full rounded-lg bg-slate-700/50" />
            <Skeleton className="h-8 w-1/2 rounded-lg bg-slate-700/50" />
          </div>
        )}
        {!error && !isLoading && children}
      </CardContent>
    </Card>
  );
}
