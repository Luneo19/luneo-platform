'use client';

import React, { useEffect, useState, useCallback, useMemo, memo } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const THEME_OPTIONS = [
  {
    id: 'light' as const,
    label: 'Mode clair',
    description: 'Interface lumineuse idéale en journée',
    icon: Sun,
  },
  {
    id: 'dark' as const,
    label: 'Mode sombre',
    description: 'Contraste élevé pour les environnements peu lumineux',
    icon: Moon,
  },
  {
    id: 'system' as const,
    label: 'Synchronisé avec l’OS',
    description: 'Adapte automatiquement la palette selon vos préférences système',
    icon: Monitor,
  },
] as const;

function ThemeToggleContent({ className }: { className?: string }) {
  const { resolvedTheme, setTheme, theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleThemeChange = useCallback((themeId: string) => {
    setTheme(themeId);
  }, [setTheme]);

  const ActiveIcon = useMemo(() => 
    resolvedTheme === 'dark' ? Moon : resolvedTheme === 'light' ? Sun : Monitor,
    [resolvedTheme]
  );

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className={cn('h-10 w-10', className)}
        aria-label="Changer de thème"
        disabled
      >
        <Sun className="h-5 w-5 animate-pulse" />
      </Button>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn('h-10 w-10', className)}
          aria-label={`Thème actuel : ${resolvedTheme ?? 'système'}`}
        >
          <ActiveIcon className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-3"
        side="bottom"
        align="end"
        sideOffset={8}
        aria-label="Sélection du thème"
      >
        <div className="flex flex-col space-y-1">
          {THEME_OPTIONS.map(({ id, label, description, icon: Icon }) => {
            const isActive = (theme ?? 'system') === id || (id === 'system' && theme === undefined);

            return (
              <button
                key={id}
                type="button"
                onClick={() => handleThemeChange(id)}
                className={cn(
                  'flex w-full items-start gap-3 rounded-md border border-transparent px-3 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive
                    ? 'bg-primary/10 text-foreground'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
                aria-pressed={isActive}
              >
                <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="font-medium leading-none">{label}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

const ThemeToggleContentMemo = memo(ThemeToggleContent);

export function ThemeToggle(props: { className?: string }) {
  return (
    <ErrorBoundary componentName="ThemeToggle">
      <ThemeToggleContentMemo {...props} />
    </ErrorBoundary>
  );
}

