'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/* ──────────────────────────────────────────────────────────
   OrbitingCircles — Madgicx-style orbiting elements
   Elements rotate along circular paths around a center point.
   ────────────────────────────────────────────────────────── */

export interface OrbitingCirclesProps {
  /** Children nodes to orbit (each child gets its own orbit slot) */
  children: React.ReactNode;
  /** Radius of the orbit in pixels */
  radius?: number;
  /** Duration of one full orbit in seconds */
  duration?: number;
  /** Reverse orbit direction */
  reverse?: boolean;
  /** Delay before starting (seconds) */
  delay?: number;
  /** Additional className for the orbit container */
  className?: string;
  /** Path stroke color */
  pathColor?: string;
  /** Show the orbit path ring */
  showPath?: boolean;
  /** Path opacity */
  pathOpacity?: number;
  /** Path glow */
  pathGlow?: boolean;
}

export function OrbitingCircles({
  children,
  radius = 160,
  duration = 20,
  reverse = false,
  delay = 0,
  className,
  pathColor = 'rgba(99, 102, 241, 0.15)',
  showPath = true,
  pathOpacity = 1,
  pathGlow = false,
}: OrbitingCirclesProps) {
  const childArray = React.Children.toArray(children);
  const angleStep = 360 / childArray.length;

  return (
    <div className={cn('relative', className)}>
      {/* Orbit path ring */}
      {showPath && (
        <svg
          className="pointer-events-none absolute inset-0"
          style={{
            width: radius * 2 + 40,
            height: radius * 2 + 40,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: pathOpacity,
          }}
          viewBox={`0 0 ${radius * 2 + 40} ${radius * 2 + 40}`}
        >
          {pathGlow && (
            <defs>
              <filter id={`orbit-glow-${radius}`}>
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
          )}
          <circle
            cx={radius + 20}
            cy={radius + 20}
            r={radius}
            fill="none"
            stroke={pathColor}
            strokeWidth="1"
            strokeDasharray="4 6"
            filter={pathGlow ? `url(#orbit-glow-${radius})` : undefined}
          />
        </svg>
      )}

      {/* Orbiting children */}
      {childArray.map((child, i) => {
        const startAngle = angleStep * i;
        return (
          <div
            key={i}
            className="absolute left-1/2 top-1/2"
            style={{
              animation: `orbit-spin ${duration}s linear infinite${reverse ? ' reverse' : ''}`,
              animationDelay: `${delay + (duration / childArray.length) * i * -1}s`,
              width: 0,
              height: 0,
              transform: `rotate(${startAngle}deg)`,
            }}
          >
            <div
              style={{
                transform: `translateY(-${radius}px)`,
              }}
            >
              {/* Counter-rotate so children stay upright */}
              <div
                style={{
                  animation: `orbit-spin ${duration}s linear infinite${reverse ? '' : ' reverse'}`,
                  animationDelay: `${delay + (duration / childArray.length) * i * -1}s`,
                }}
              >
                {child}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   OrbitIcon — Styled icon wrapper for orbiting elements
   ────────────────────────────────────────────────────────── */

export interface OrbitIconProps {
  children: React.ReactNode;
  className?: string;
  /** Glow color */
  glowColor?: string;
  /** Size in pixels */
  size?: number;
}

export function OrbitIcon({
  children,
  className,
  glowColor = 'rgba(99, 102, 241, 0.4)',
  size = 40,
}: OrbitIconProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl',
        'bg-dark-surface/80 backdrop-blur-md border border-white/[0.08]',
        'transition-all duration-300',
        className
      )}
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 20px ${glowColor}, 0 0 40px ${glowColor}`,
      }}
    >
      {children}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────
   MultiOrbit — Multiple concentric orbits (like Madgicx)
   ────────────────────────────────────────────────────────── */

export interface OrbitRingConfig {
  radius: number;
  duration: number;
  reverse?: boolean;
  delay?: number;
  children: React.ReactNode;
  pathColor?: string;
  showPath?: boolean;
  pathGlow?: boolean;
}

export interface MultiOrbitProps {
  /** Array of orbit configurations */
  orbits: OrbitRingConfig[];
  /** Center content */
  centerContent?: React.ReactNode;
  /** Container className */
  className?: string;
  /** Width/height of the orbit container */
  size?: number;
}

export function MultiOrbit({
  orbits,
  centerContent,
  className,
  size = 500,
}: MultiOrbitProps) {
  return (
    <div
      className={cn('relative', className)}
      style={{ width: size, height: size }}
    >
      {/* Center content */}
      {centerContent && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
          {centerContent}
        </div>
      )}

      {/* Orbit rings */}
      {orbits.map((orbit, i) => (
        <div
          key={i}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <OrbitingCircles
            radius={orbit.radius}
            duration={orbit.duration}
            reverse={orbit.reverse}
            delay={orbit.delay}
            pathColor={orbit.pathColor}
            showPath={orbit.showPath ?? true}
            pathGlow={orbit.pathGlow}
          >
            {orbit.children}
          </OrbitingCircles>
        </div>
      ))}
    </div>
  );
}
