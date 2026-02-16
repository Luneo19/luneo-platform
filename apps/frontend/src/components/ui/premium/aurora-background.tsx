'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface AuroraBackgroundProps {
  children?: React.ReactNode;
  className?: string;
  variant?: 'default' | 'subtle' | 'intense';
}

export function AuroraBackground({
  children,
  className,
  variant = 'default',
}: AuroraBackgroundProps) {
  const opacities = {
    default: { orb1: 0.15, orb2: 0.12, orb3: 0.08 },
    subtle: { orb1: 0.08, orb2: 0.06, orb3: 0.04 },
    intense: { orb1: 0.25, orb2: 0.2, orb3: 0.15 },
  };

  const o = opacities[variant];

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        {/* Primary indigo orb */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[60vw] h-[60vw] rounded-full animate-float"
          style={{
            background: `radial-gradient(circle, rgba(99,102,241,${o.orb1}) 0%, transparent 70%)`,
            filter: 'blur(80px)',
          }}
        />
        {/* Violet accent orb */}
        <div
          className="absolute -bottom-1/4 -right-1/4 w-[50vw] h-[50vw] rounded-full animate-float"
          style={{
            background: `radial-gradient(circle, rgba(124,58,237,${o.orb2}) 0%, transparent 70%)`,
            filter: 'blur(80px)',
            animationDelay: '-7s',
            animationDuration: '25s',
          }}
        />
        {/* Cyan accent orb */}
        <div
          className="absolute top-1/3 right-1/4 w-[35vw] h-[35vw] rounded-full animate-float"
          style={{
            background: `radial-gradient(circle, rgba(6,182,212,${o.orb3}) 0%, transparent 70%)`,
            filter: 'blur(60px)',
            animationDelay: '-12s',
            animationDuration: '30s',
          }}
        />
        {/* Fine grain noise overlay */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
            backgroundSize: '128px 128px',
          }}
        />
      </div>
      {children && <div className="relative z-10">{children}</div>}
    </div>
  );
}

interface GlowOrbProps {
  className?: string;
  color?: string;
  size?: string;
  blur?: number;
}

export function GlowOrb({
  className,
  color = 'rgba(99,102,241,0.15)',
  size = '400px',
  blur = 80,
}: GlowOrbProps) {
  return (
    <div
      className={cn('absolute rounded-full pointer-events-none animate-float', className)}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      aria-hidden="true"
    />
  );
}
