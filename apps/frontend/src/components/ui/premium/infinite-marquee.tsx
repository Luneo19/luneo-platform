'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InfiniteMarqueeProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: 'left' | 'right';
  pauseOnHover?: boolean;
  gap?: number;
}

export function InfiniteMarquee({
  children,
  className,
  speed = 25,
  direction = 'left',
  pauseOnHover = true,
  gap = 48,
}: InfiniteMarqueeProps) {
  const animDir = direction === 'left' ? 'marquee' : 'marquee-reverse';

  return (
    <div
      className={cn(
        'relative overflow-hidden',
        pauseOnHover && '[&:hover_.marquee-track]:pause',
        className,
      )}
    >
      {/* Fade edges */}
      <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-dark-bg to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-dark-bg to-transparent z-10 pointer-events-none" />

      <div
        className="marquee-track flex items-center"
        style={{
          animation: `${animDir} ${speed}s linear infinite`,
          gap: `${gap}px`,
        }}
      >
        {children}
        {children}
        {children}
      </div>
    </div>
  );
}

interface LogoCloudProps {
  logos: Array<{ name: string; svg?: React.ReactNode; width?: number }>;
  className?: string;
  speed?: number;
}

export function LogoCloud({ logos, className, speed = 30 }: LogoCloudProps) {
  return (
    <InfiniteMarquee speed={speed} className={className} gap={64}>
      {logos.map((logo, i) => (
        <div
          key={i}
          className="flex-shrink-0 flex items-center justify-center opacity-40 hover:opacity-70 transition-opacity duration-300 grayscale hover:grayscale-0"
          style={{ width: logo.width || 120 }}
        >
          {logo.svg || (
            <span className="text-white/50 text-sm font-medium tracking-wider uppercase">
              {logo.name}
            </span>
          )}
        </div>
      ))}
    </InfiniteMarquee>
  );
}
