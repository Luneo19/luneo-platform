'use client';

import { useEffect, useRef } from 'react';
import { useCursorGlow } from '@/hooks/useCursorGlow';
import { useScrollAnimations } from '@/hooks/useScrollAnimations';

/**
 * Cursor Glow Component - Provides cursor glow effect
 */
export function CursorGlow() {
  const cursorRef = useCursorGlow();
  useScrollAnimations(); // Initialize scroll animations

  return (
    <div
      ref={cursorRef}
      className="cursor-glow"
      id="cursorGlow"
      aria-hidden="true"
    />
  );
}
