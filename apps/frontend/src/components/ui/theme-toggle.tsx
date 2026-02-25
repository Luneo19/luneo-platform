'use client';

import { useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEMES = [
  { id: 'light', icon: Sun, label: 'Mode clair' },
  { id: 'dark', icon: Moon, label: 'Mode sombre' },
  { id: 'system', icon: Monitor, label: 'Système' },
] as const;

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'glass';
}

export function ThemeToggle({ className, variant = 'glass' }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cycleTheme = useCallback(() => {
    const current = theme ?? 'system';
    const order = ['light', 'dark', 'system'] as const;
    const idx = order.indexOf(current as (typeof order)[number]);
    setTheme(order[(idx + 1) % order.length]);
  }, [theme, setTheme]);

  if (!mounted) {
    return (
      <button
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
          variant === 'glass'
            ? 'bg-white/[0.04] border border-white/[0.06] text-white/50'
            : 'bg-muted text-muted-foreground',
          className,
        )}
        aria-label="Changer de thème"
        disabled
      >
        <Sun className="h-4 w-4 animate-pulse" />
      </button>
    );
  }

  const ActiveIcon =
    resolvedTheme === 'dark' ? Moon : resolvedTheme === 'light' ? Sun : Monitor;

  const currentLabel =
    THEMES.find((t) => t.id === (theme ?? 'system'))?.label ?? 'Système';

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'relative flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200',
        variant === 'glass'
          ? 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] text-white/60 hover:text-white/90'
          : 'bg-muted hover:bg-accent text-muted-foreground hover:text-accent-foreground',
        className,
      )}
      aria-label={`Thème : ${currentLabel}. Cliquer pour changer.`}
      title={currentLabel}
    >
      <ActiveIcon className="h-4 w-4" />
    </button>
  );
}
