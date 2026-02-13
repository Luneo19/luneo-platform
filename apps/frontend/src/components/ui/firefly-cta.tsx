'use client';

import React, { memo } from 'react';

// =============================================================================
// FIREFLY CTA - Orbiting luminous particles around CTA buttons
// Inspired by madgicx.com - subtle glowing fireflies orbit continuously
// Pure CSS animation, GPU-accelerated, respects prefers-reduced-motion
// =============================================================================

interface FireflyCTAProps {
  children: React.ReactNode;
  /** Additional className for the outer wrapper */
  className?: string;
  /** Color scheme for the fireflies */
  color?: 'purple' | 'cyan' | 'white' | 'rainbow';
  /** Speed: 'slow' (10s) | 'normal' (7s) | 'fast' (4s) */
  speed?: 'slow' | 'normal' | 'fast';
  /** Whether the animation is active (default: true) */
  active?: boolean;
}

const SPEEDS = { slow: 10, normal: 7, fast: 4 };

// Each firefly has: color, glow, orbit delay offset, orbit direction
const FIREFLY_CONFIGS = {
  purple: [
    { color: '#a855f7', glow: 'rgba(168,85,247,0.6)' },
    { color: '#c084fc', glow: 'rgba(192,132,252,0.5)' },
    { color: '#8b5cf6', glow: 'rgba(139,92,246,0.6)' },
  ],
  cyan: [
    { color: '#22d3ee', glow: 'rgba(34,211,238,0.5)' },
    { color: '#67e8f9', glow: 'rgba(103,232,249,0.5)' },
    { color: '#06b6d4', glow: 'rgba(6,182,212,0.5)' },
  ],
  white: [
    { color: 'rgba(255,255,255,0.95)', glow: 'rgba(255,255,255,0.4)' },
    { color: 'rgba(226,232,240,0.9)', glow: 'rgba(226,232,240,0.35)' },
    { color: 'rgba(255,255,255,0.85)', glow: 'rgba(255,255,255,0.3)' },
  ],
  rainbow: [
    { color: '#a855f7', glow: 'rgba(168,85,247,0.5)' },
    { color: '#ec4899', glow: 'rgba(236,72,153,0.5)' },
    { color: '#22d3ee', glow: 'rgba(34,211,238,0.5)' },
  ],
};

function FireflyCTAInner({
  children,
  className = '',
  color = 'purple',
  speed = 'normal',
  active = true,
}: FireflyCTAProps) {
  const duration = SPEEDS[speed];
  const configs = FIREFLY_CONFIGS[color];

  if (!active) {
    return <div className={`relative inline-flex ${className}`}>{children}</div>;
  }

  return (
    <div className={`firefly-cta group/firefly relative inline-flex ${className}`}>
      {/* Firefly particles container */}
      <div className="absolute inset-[-10px] pointer-events-none overflow-visible z-30" aria-hidden="true">
        {configs.map((fly, i) => {
          const flyDuration = duration + i * 1.2;
          const delay = -(i * (duration / configs.length));
          const isReverse = i % 2 === 1;

          return (
            <div
              key={i}
              className="firefly-dot absolute gpu-accelerated"
              style={{
                width: '3px',
                height: '3px',
                background: fly.color,
                borderRadius: '50%',
                boxShadow: `0 0 6px 2px ${fly.glow}, 0 0 12px 4px ${fly.glow}`,
                top: '50%',
                left: '50%',
                marginTop: '-1.5px',
                marginLeft: '-1.5px',
                animation: `firefly-orbit ${flyDuration}s linear infinite${isReverse ? ' reverse' : ''}`,
                animationDelay: `${delay}s`,
                // Each firefly gets a slightly different orbit radius via CSS var
                '--orbit-rx': `calc(50% + ${8 + i * 4}px)`,
                '--orbit-ry': `calc(50% + ${4 + i * 2}px)`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      {/* The CTA button content */}
      <div className="relative z-20 w-full">
        {children}
      </div>
    </div>
  );
}

export const FireflyCTA = memo(FireflyCTAInner);
