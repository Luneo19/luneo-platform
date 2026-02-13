'use client';

import React, { useRef, useState, useCallback, memo } from 'react';

// =============================================================================
// TILT CARD - 3D perspective tilt on hover with cursor-following glow
// Premium micro-interaction for feature cards, pricing cards, etc.
// =============================================================================

interface TiltCardProps {
  children: React.ReactNode;
  /** Max rotation in degrees (default: 8) */
  maxTilt?: number;
  /** Perspective distance in px (default: 1000) */
  perspective?: number;
  /** Scale on hover (default: 1.02) */
  hoverScale?: number;
  /** Enable cursor-following glow (default: true) */
  glowEnabled?: boolean;
  /** Glow color (default: purple) */
  glowColor?: string;
  /** Glow size in px (default: 200) */
  glowSize?: number;
  /** Additional className */
  className?: string;
  /** Transition speed in ms (default: 400) */
  transitionSpeed?: number;
  /** Component tag (default: div) */
  as?: 'div' | 'article' | 'section' | 'li';
}

function TiltCardInner({
  children,
  maxTilt = 8,
  perspective = 1000,
  hoverScale = 1.02,
  glowEnabled = true,
  glowColor = 'rgba(168, 85, 247, 0.15)',
  glowSize = 200,
  className = '',
  transitionSpeed = 400,
  as: Tag = 'div',
}: TiltCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      // Calculate rotation (inverted for natural feel)
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      setTiltStyle({
        transform: `perspective(${perspective}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(${hoverScale}, ${hoverScale}, ${hoverScale})`,
      });

      if (glowEnabled) {
        setGlowStyle({
          background: `radial-gradient(${glowSize}px circle at ${x}px ${y}px, ${glowColor}, transparent 60%)`,
          opacity: 1,
        });
      }
    },
    [maxTilt, perspective, hoverScale, glowEnabled, glowColor, glowSize],
  );

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setTiltStyle({
      transform: `perspective(${perspective}px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`,
    });
    if (glowEnabled) {
      setGlowStyle({ opacity: 0 });
    }
  }, [perspective, glowEnabled]);

  return (
    <Tag
      ref={cardRef as React.RefObject<never>}
      className={`tilt-card relative ${className}`}
      onMouseMove={handleMouseMove as React.MouseEventHandler<HTMLElement>}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...tiltStyle,
        transformStyle: 'preserve-3d',
        transition: isHovered
          ? `transform ${transitionSpeed * 0.3}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`
          : `transform ${transitionSpeed}ms cubic-bezier(0.03, 0.98, 0.52, 0.99)`,
        willChange: 'transform',
      }}
    >
      {/* Cursor-following glow */}
      {glowEnabled && (
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none z-0"
          style={{
            ...glowStyle,
            transition: `opacity ${transitionSpeed}ms ease`,
          }}
          aria-hidden="true"
        />
      )}

      {/* Card content */}
      <div className="relative z-10" style={{ transformStyle: 'preserve-3d' }}>
        {children}
      </div>
    </Tag>
  );
}

export const TiltCard = memo(TiltCardInner);

// =============================================================================
// GLOW CARD - Card with ambient glow effect on hover (no tilt)
// Lighter-weight alternative for simpler interactions
// =============================================================================

interface GlowCardProps {
  children: React.ReactNode;
  /** Glow color */
  glowColor?: string;
  /** Additional className */
  className?: string;
  /** Component tag */
  as?: 'div' | 'article' | 'section' | 'li';
}

function GlowCardInner({
  children,
  glowColor = 'rgba(168, 85, 247, 0.12)',
  className = '',
  as: Tag = 'div',
}: GlowCardProps) {
  const cardRef = useRef<HTMLElement>(null);
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setGlowStyle({
        background: `radial-gradient(250px circle at ${x}px ${y}px, ${glowColor}, transparent 60%)`,
        opacity: 1,
      });
    },
    [glowColor],
  );

  const handleMouseLeave = useCallback(() => {
    setGlowStyle({ opacity: 0 });
  }, []);

  return (
    <Tag
      ref={cardRef as React.RefObject<never>}
      className={`glow-card relative ${className}`}
      onMouseMove={handleMouseMove as React.MouseEventHandler<HTMLElement>}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="absolute inset-0 rounded-[inherit] pointer-events-none z-0"
        style={{
          ...glowStyle,
          transition: 'opacity 400ms ease',
        }}
        aria-hidden="true"
      />
      <div className="relative z-10">
        {children}
      </div>
    </Tag>
  );
}

export const GlowCard = memo(GlowCardInner);

// =============================================================================
// MAGNETIC HOVER - Small elements that follow cursor slightly
// =============================================================================

interface MagneticProps {
  children: React.ReactNode;
  /** Magnetic strength (0-1, default: 0.3) */
  strength?: number;
  /** Additional className */
  className?: string;
}

function MagneticInner({
  children,
  strength = 0.3,
  className = '',
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      setStyle({
        transform: `translate(${x * strength}px, ${y * strength}px)`,
      });
    },
    [strength],
  );

  const handleMouseLeave = useCallback(() => {
    setStyle({ transform: 'translate(0px, 0px)' });
  }, []);

  return (
    <div
      ref={ref}
      className={`magnetic-element ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        ...style,
        transition: 'transform 300ms cubic-bezier(0.03, 0.98, 0.52, 0.99)',
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  );
}

export const Magnetic = memo(MagneticInner);
