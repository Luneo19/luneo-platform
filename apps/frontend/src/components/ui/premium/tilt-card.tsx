'use client';

import React, { useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  tiltStrength?: number;
  glareEnabled?: boolean;
  glareColor?: string;
  borderGlow?: boolean;
  perspective?: number;
}

export function TiltCard({
  children,
  className,
  tiltStrength = 10,
  glareEnabled = true,
  glareColor = 'rgba(99, 102, 241, 0.15)',
  borderGlow = true,
  perspective = 1000,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState('');
  const [glarePos, setGlarePos] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      const rotateX = (0.5 - y) * tiltStrength;
      const rotateY = (x - 0.5) * tiltStrength;
      setTransform(
        `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`,
      );
      setGlarePos({ x: x * 100, y: y * 100 });
    },
    [tiltStrength, perspective],
  );

  const handleMouseLeave = useCallback(() => {
    setTransform('');
    setIsHovered(false);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      className={cn(
        'relative rounded-2xl overflow-hidden transition-transform duration-300 ease-out',
        'bg-white/[0.03] backdrop-blur-xl',
        borderGlow && 'border border-white/[0.06]',
        className,
      )}
      style={{
        transform: transform || undefined,
        willChange: 'transform',
        boxShadow: isHovered
          ? '0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.08), 0 0 80px rgba(99,102,241,0.08)'
          : '0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)',
      }}
    >
      {glareEnabled && (
        <div
          className="pointer-events-none absolute inset-0 z-10 transition-opacity duration-300"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, ${glareColor}, transparent 60%)`,
          }}
        />
      )}
      {borderGlow && isHovered && (
        <div
          className="pointer-events-none absolute inset-0 z-10 rounded-[inherit]"
          style={{
            background: `radial-gradient(circle at ${glarePos.x}% ${glarePos.y}%, rgba(99,102,241,0.3), transparent 50%)`,
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            WebkitMaskComposite: 'xor',
            padding: '1px',
          }}
        />
      )}
      <div className="relative z-20">{children}</div>
    </div>
  );
}
