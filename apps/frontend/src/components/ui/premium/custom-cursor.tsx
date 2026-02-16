'use client';

import React, { useEffect, useRef, useState } from 'react';

interface CustomCursorProps {
  color?: string;
  size?: number;
  trailLength?: number;
}

export function CustomCursor({
  color = '#6366f1',
  size = 24,
  trailLength = 8,
}: CustomCursorProps) {
  const cursorRef = useRef<HTMLDivElement>(null);
  const trailRef = useRef<HTMLDivElement>(null);
  const posRef = useRef({ x: -100, y: -100 });
  const trailPosRef = useRef({ x: -100, y: -100 });
  const [isPointer, setIsPointer] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (isMobile) return;

    const handleMouseMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${e.clientX - size / 2}px, ${e.clientY - size / 2}px)`;
      }
      const target = e.target as HTMLElement;
      const isClickable =
        target.closest('a, button, [role="button"], input, select, textarea, [tabindex]') !== null;
      setIsPointer(isClickable);
    };

    const handleMouseLeave = () => setIsHidden(true);
    const handleMouseEnter = () => setIsHidden(false);

    let animFrame: number;
    const animateTrail = () => {
      const tx = trailPosRef.current.x + (posRef.current.x - trailPosRef.current.x) * 0.15;
      const ty = trailPosRef.current.y + (posRef.current.y - trailPosRef.current.y) * 0.15;
      trailPosRef.current = { x: tx, y: ty };
      if (trailRef.current) {
        trailRef.current.style.transform = `translate(${tx - size}px, ${ty - size}px)`;
      }
      animFrame = requestAnimationFrame(animateTrail);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);
    animFrame = requestAnimationFrame(animateTrail);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      cancelAnimationFrame(animFrame);
    };
  }, [size, isMobile]);

  if (isMobile) return null;

  return (
    <>
      <style>{`
        * { cursor: none !important; }
      `}</style>
      <div
        ref={cursorRef}
        className="fixed top-0 left-0 pointer-events-none z-[9999] mix-blend-difference"
        style={{
          width: size,
          height: size,
          opacity: isHidden ? 0 : 1,
          transition: 'opacity 0.2s, width 0.3s, height 0.3s',
        }}
      >
        <div
          className="w-full h-full rounded-full border-2 transition-all duration-300"
          style={{
            borderColor: color,
            transform: isPointer ? 'scale(1.5)' : 'scale(1)',
            backgroundColor: isPointer ? `${color}33` : 'transparent',
          }}
        />
      </div>
      <div
        ref={trailRef}
        className="fixed top-0 left-0 pointer-events-none z-[9998]"
        style={{
          width: size * 2,
          height: size * 2,
          opacity: isHidden ? 0 : 0.3,
          transition: 'opacity 0.3s',
        }}
      >
        <div
          className="w-full h-full rounded-full"
          style={{
            background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            filter: 'blur(4px)',
          }}
        />
      </div>
    </>
  );
}
