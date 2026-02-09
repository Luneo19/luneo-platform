'use client';

import React, { memo } from 'react';

// =============================================================================
// ANIMATED BORDER - Rotating conic-gradient border (madgicx style)
// =============================================================================

interface AnimatedBorderProps {
  children: React.ReactNode;
  /** Additional className for the outer wrapper */
  className?: string;
  /** Border radius in Tailwind classes */
  rounded?: string;
  /** Border width in pixels */
  borderWidth?: number;
  /** Animation speed: slow (6s), normal (3s), fast (1.5s) */
  speed?: 'slow' | 'normal' | 'fast';
  /** Gradient colors */
  gradient?: 'purple-pink' | 'blue-cyan' | 'emerald-teal' | 'amber-orange' | 'rainbow';
  /** Whether the animation is active (useful for hover-only) */
  active?: boolean;
  /** Only show on hover */
  hoverOnly?: boolean;
  /** For CTA buttons - compact padding */
  compact?: boolean;
}

const GRADIENTS = {
  'purple-pink': 'from-purple-500 via-pink-500 to-purple-500',
  'blue-cyan': 'from-blue-500 via-cyan-500 to-blue-500',
  'emerald-teal': 'from-emerald-500 via-teal-500 to-emerald-500',
  'amber-orange': 'from-amber-500 via-orange-500 to-amber-500',
  'rainbow': 'from-purple-500 via-pink-500 via-blue-500 to-purple-500',
};

const SPEEDS = {
  slow: '6s',
  normal: '3s',
  fast: '1.5s',
};

function AnimatedBorderInner({
  children,
  className = '',
  rounded = 'rounded-2xl',
  borderWidth = 1,
  speed = 'normal',
  gradient = 'purple-pink',
  active = true,
  hoverOnly = false,
  compact = false,
}: AnimatedBorderProps) {
  const duration = SPEEDS[speed];
  const padding = compact ? `${borderWidth}px` : `${borderWidth}px`;

  return (
    <div
      className={`animated-border-wrapper group/border relative ${rounded} ${className}`}
      style={{ padding }}
    >
      {/* Rotating gradient border */}
      <div
        className={`animated-border-gradient absolute inset-0 ${rounded} overflow-hidden ${
          hoverOnly ? 'opacity-0 group-hover/border:opacity-100' : active ? 'opacity-100' : 'opacity-0'
        } transition-opacity duration-500`}
        style={{ '--border-speed': duration } as React.CSSProperties}
      >
        <div
          className="animated-border-spin absolute inset-[-200%] gpu-accelerated"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,1) 8%, rgba(236,72,153,1) 18%, transparent 28%, transparent 72%, rgba(168,85,247,1) 82%, rgba(236,72,153,1) 92%, transparent 100%)`,
            animation: `spin ${duration} linear infinite`,
          }}
        />
      </div>

      {/* Glow layer for extra visibility */}
      <div
        className={`absolute inset-0 ${rounded} overflow-hidden ${
          hoverOnly ? 'opacity-0 group-hover/border:opacity-60' : active ? 'opacity-40' : 'opacity-0'
        } transition-opacity duration-500 blur-md -z-[1]`}
      >
        <div
          className="absolute inset-[-200%] gpu-accelerated"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,0.6) 8%, rgba(236,72,153,0.6) 18%, transparent 28%, transparent 72%, rgba(168,85,247,0.6) 82%, rgba(236,72,153,0.6) 92%, transparent 100%)`,
            animation: `spin ${duration} linear infinite`,
          }}
        />
      </div>

      {/* Inner content with background to mask the gradient */}
      <div className={`relative ${rounded} bg-dark-card z-10`}>
        {children}
      </div>
    </div>
  );
}

export const AnimatedBorder = memo(AnimatedBorderInner);

// =============================================================================
// ANIMATED BORDER CTA - For buttons
// =============================================================================

interface AnimatedBorderCTAProps {
  children: React.ReactNode;
  className?: string;
  speed?: 'slow' | 'normal' | 'fast';
}

function AnimatedBorderCTAInner({
  children,
  className = '',
  speed = 'fast',
}: AnimatedBorderCTAProps) {
  const duration = SPEEDS[speed];

  return (
    <div className={`animated-border-cta relative inline-flex ${className}`} style={{ padding: '2px' }}>
      {/* Rotating gradient */}
      <div className="absolute inset-0 rounded-lg overflow-hidden">
        <div
          className="absolute inset-[-200%] gpu-accelerated"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,1) 8%, rgba(236,72,153,1) 18%, transparent 28%, transparent 72%, rgba(168,85,247,1) 82%, rgba(236,72,153,1) 92%, transparent 100%)`,
            animation: `spin ${duration} linear infinite`,
          }}
        />
      </div>
      {/* Glow layer */}
      <div className="absolute inset-0 rounded-lg overflow-hidden blur-sm opacity-60 -z-[1]">
        <div
          className="absolute inset-[-200%] gpu-accelerated"
          style={{
            background: `conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,0.8) 8%, rgba(236,72,153,0.8) 18%, transparent 28%, transparent 72%, rgba(168,85,247,0.8) 82%, rgba(236,72,153,0.8) 92%, transparent 100%)`,
            animation: `spin ${duration} linear infinite`,
          }}
        />
      </div>
      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}

export const AnimatedBorderCTA = memo(AnimatedBorderCTAInner);
