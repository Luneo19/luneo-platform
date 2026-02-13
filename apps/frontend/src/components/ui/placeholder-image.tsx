'use client';

import { cn } from '@/lib/utils';

export function PlaceholderImage({
  width,
  height,
  text,
  className,
}: {
  width?: number;
  height?: number;
  text?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center',
        className
      )}
      style={{ width, height }}
    >
      <span className="text-indigo-400 text-sm">{text ?? 'Luneo'}</span>
    </div>
  );
}
