'use client';

import React, { memo, useRef, useEffect, useState } from 'react';

interface FireflyCTAProps {
  children: React.ReactNode;
  className?: string;
  color?: 'purple' | 'cyan' | 'white' | 'rainbow';
  speed?: 'slow' | 'normal' | 'fast';
  active?: boolean;
}

const SPEEDS = { slow: 10, normal: 7, fast: 4 };

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
  const containerRef = useRef<HTMLDivElement>(null);
  const [orbitBase, setOrbitBase] = useState<{ rx: number; ry: number } | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    setOrbitBase({ rx: width / 2 + 18, ry: height / 2 + 12 });
  }, []);

  if (!active) {
    return <div className={`relative inline-flex ${className}`}>{children}</div>;
  }

  return (
    <div ref={containerRef} className={`firefly-cta group/firefly relative inline-flex ${className}`}>
      <div className="absolute inset-[-20px] pointer-events-none overflow-visible z-30" aria-hidden="true">
        {configs.map((fly, i) => {
          const flyDuration = duration + i * 1.2;
          const delay = -(i * (duration / configs.length));
          const isReverse = i % 2 === 1;
          const rx = orbitBase ? orbitBase.rx + i * 8 : 60;
          const ry = orbitBase ? orbitBase.ry + i * 4 : 30;

          return (
            <div
              key={i}
              className="firefly-dot absolute"
              style={{
                width: '4px',
                height: '4px',
                background: fly.color,
                borderRadius: '50%',
                boxShadow: `0 0 8px 3px ${fly.glow}, 0 0 16px 6px ${fly.glow}`,
                top: '50%',
                left: '50%',
                marginTop: '-2px',
                marginLeft: '-2px',
                willChange: 'transform, opacity',
                animation: `firefly-orbit ${flyDuration}s linear infinite${isReverse ? ' reverse' : ''}`,
                animationDelay: `${delay}s`,
                '--orbit-rx': `${rx}px`,
                '--orbit-ry': `${ry}px`,
              } as React.CSSProperties}
            />
          );
        })}
      </div>

      <div className="relative z-20 w-full">
        {children}
      </div>
    </div>
  );
}

export const FireflyCTA = memo(FireflyCTAInner);
