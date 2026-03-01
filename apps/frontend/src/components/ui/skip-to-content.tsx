'use client';

import { cn } from '@/lib/utils';

interface SkipToContentProps {
  targetId?: string;
  label?: string;
  className?: string;
}

export function SkipToContent({
  targetId = 'main-content',
  label = 'Aller au contenu principal',
  className,
}: SkipToContentProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        'fixed top-4 left-4 z-[9999] px-5 py-3 rounded-full',
        'bg-primary text-primary-foreground font-semibold text-sm',
        'shadow-lg ring-2 ring-primary/40',
        'translate-y-[-200%] focus:translate-y-0',
        'transition-transform duration-200',
        'focus:outline-none',
        className,
      )}
    >
      {label}
    </a>
  );
}
