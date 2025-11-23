'use client';

import { ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDemoMode } from '@/hooks/useDemoMode';
import { cn } from '@/lib/utils';

interface DemoModeToggleProps {
  className?: string;
}

export function DemoModeToggle({ className }: DemoModeToggleProps) {
  const { isAvailable, isDemoMode, enableDemo, disableDemo } = useDemoMode();

  if (!isAvailable) {
    return null;
  }

  return (
    <Button
      variant={isDemoMode ? 'default' : 'outline'}
      size="sm"
      onClick={isDemoMode ? disableDemo : enableDemo}
      className={cn(
        'flex items-center gap-2 rounded-full border border-purple-500/50 bg-purple-500/10 text-purple-100 hover:bg-purple-500/20',
        !isDemoMode && 'border-purple-400/40 bg-transparent text-purple-200 hover:bg-purple-400/10',
        className,
      )}
    >
      {isDemoMode ? (
        <ToggleRight className="h-4 w-4" aria-hidden="true" />
      ) : (
        <ToggleLeft className="h-4 w-4" aria-hidden="true" />
      )}
      <span className="text-xs font-semibold uppercase tracking-wide">
        {isDemoMode ? 'Mode démo actif' : 'Activer mode démo'}
      </span>
    </Button>
  );
}

