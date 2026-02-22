'use client';

import React, { useRef, memo } from 'react';
import { motion, useScroll, useTransform, useSpring, MotionValue } from 'framer-motion';

// =============================================================================
// SCROLL SEQUENCE - Apple-style scroll-driven content reveal
// Uses framer-motion's useScroll + useTransform for smooth scroll-linked animations
// =============================================================================

// ---------------------------------------------------------------------------
// 1. ScrollSequence - Container that pins content during scroll
// ---------------------------------------------------------------------------

interface ScrollSequenceProps {
  children: React.ReactNode;
  /** Total scroll height as multiplier of viewport height (default: 3) */
  scrollMultiplier?: number;
  /** Additional className for the sticky container */
  className?: string;
}

function ScrollSequenceInner({
  children,
  scrollMultiplier = 3,
  className = '',
}: ScrollSequenceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div
      ref={containerRef}
      className="relative"
      style={{ height: `${scrollMultiplier * 100}vh` }}
    >
      <div className={`sticky top-0 h-screen overflow-hidden ${className}`}>
        <ScrollSequenceContext.Provider value={smoothProgress}>
          {children}
        </ScrollSequenceContext.Provider>
      </div>
    </div>
  );
}

export const ScrollSequence = memo(ScrollSequenceInner);

// Context to share scroll progress with child components
const ScrollSequenceContext = React.createContext<MotionValue<number> | null>(null);

function useScrollSequenceProgress(): MotionValue<number> {
  const context = React.useContext(ScrollSequenceContext);
  if (!context) {
    throw new Error('useScrollSequenceProgress must be used within <ScrollSequence>');
  }
  return context;
}

// ---------------------------------------------------------------------------
// 2. ScrollStep - Reveals content at a specific scroll range
// ---------------------------------------------------------------------------

interface ScrollStepProps {
  children: React.ReactNode;
  /** Start of the step (0-1 scroll progress) */
  start: number;
  /** End of the step (0-1 scroll progress) */
  end: number;
  /** Animation type for entry */
  animation?: 'fade' | 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom' | 'slide-up';
  /** Additional className */
  className?: string;
}

function ScrollStepInner({
  children,
  start,
  end,
  animation = 'fade-up',
  className = '',
}: ScrollStepProps) {
  const progress = useScrollSequenceProgress();

  // Entry animation (first 30% of the step)
  const entryEnd = start + (end - start) * 0.3;
  // Exit animation (last 20% of the step)
  const exitStart = end - (end - start) * 0.2;

  const opacity = useTransform(
    progress,
    [start, entryEnd, exitStart, end],
    [0, 1, 1, 0],
  );

  // Animation-specific transforms using the value-mapping overload
  const initY = getInitialTranslateY(animation);
  const translateY = useTransform(
    progress,
    [start, entryEnd, exitStart, end],
    [initY, 0, 0, -20],
  );

  const initX = getInitialTranslateX(animation);
  const translateX = useTransform(
    progress,
    [start, entryEnd, exitStart, end],
    [initX, 0, 0, 0],
  );

  const isZoom = animation === 'zoom';
  const scale = useTransform(
    progress,
    [start, entryEnd, exitStart, end],
    isZoom ? [0.9, 1, 1, 0.95] : [1, 1, 1, 1],
  );

  return (
    <motion.div
      className={`absolute inset-0 flex items-center justify-center ${className}`}
      style={{
        opacity,
        y: translateY,
        x: translateX,
        scale,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </motion.div>
  );
}

export const ScrollStep = memo(ScrollStepInner);

// ---------------------------------------------------------------------------
// 3. ScrollProgress - Animated progress indicator
// ---------------------------------------------------------------------------

interface ScrollProgressProps {
  /** Steps labels */
  steps: string[];
  /** Additional className */
  className?: string;
}

function ScrollProgressInner({ steps, className = '' }: ScrollProgressProps) {
  const progress = useScrollSequenceProgress();
  const scaleX = useTransform(progress, [0, 1], [0, 1]);

  return (
    <div className={`absolute bottom-8 left-1/2 -translate-x-1/2 z-40 ${className}`}>
      <div className="flex items-center gap-3">
        {steps.map((step, i) => (
          <ScrollProgressDot
            key={i}
            label={step}
            index={i}
            total={steps.length}
            progress={progress}
          />
        ))}
      </div>
      {/* Progress bar */}
      <motion.div
        className="h-0.5 bg-gradient-to-r from-purple-500 to-pink-500 mt-2 rounded-full origin-left"
        style={{ scaleX }}
      />
    </div>
  );
}

export const ScrollProgress = memo(ScrollProgressInner);

function ScrollProgressDot({
  label,
  index,
  total,
  progress,
}: {
  label: string;
  index: number;
  total: number;
  progress: MotionValue<number>;
}) {
  const stepStart = index / total;
  const stepEnd = (index + 1) / total;

  const dotScale = useTransform(progress, [stepStart, stepStart + 0.05, stepEnd - 0.05, stepEnd], [0.8, 1.2, 1.2, 0.8]);
  const dotOpacity = useTransform(progress, [stepStart, stepStart + 0.05, stepEnd - 0.05, stepEnd], [0.4, 1, 1, 0.4]);

  return (
    <motion.div className="flex flex-col items-center gap-1" style={{ opacity: dotOpacity }}>
      <motion.div
        className="w-2 h-2 rounded-full bg-white"
        style={{ scale: dotScale }}
      />
      <span className="text-[10px] text-white/70 whitespace-nowrap">{label}</span>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// 4. ScrollImage - Image that transitions with scroll progress
// ---------------------------------------------------------------------------

interface ScrollImageProps {
  /** Image source */
  src: string;
  /** Alt text */
  alt: string;
  /** Start of visibility (0-1) */
  start: number;
  /** End of visibility (0-1) */
  end: number;
  /** Additional className */
  className?: string;
  /** Scale animation range [start, end] */
  scaleRange?: [number, number];
}

function ScrollImageInner({
  src,
  alt,
  start,
  end,
  className = '',
  scaleRange = [1.1, 1],
}: ScrollImageProps) {
  const progress = useScrollSequenceProgress();

  const opacity = useTransform(
    progress,
    [start, start + (end - start) * 0.15, end - (end - start) * 0.15, end],
    [0, 1, 1, 0],
  );

  const scale = useTransform(
    progress,
    [start, end],
    scaleRange,
  );

  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      style={{ opacity, scale, willChange: 'transform, opacity' }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        loading="lazy"
      />
    </motion.div>
  );
}

export const ScrollImage = memo(ScrollImageInner);

// ---------------------------------------------------------------------------
// 5. ScrollText - Text that reveals with scroll progress
// ---------------------------------------------------------------------------

interface ScrollTextProps {
  children: React.ReactNode;
  /** Start of visibility (0-1) */
  start: number;
  /** End of visibility (0-1) */
  end: number;
  /** Position within the sticky container */
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  /** Additional className */
  className?: string;
}

function ScrollTextInner({
  children,
  start,
  end,
  position = 'center',
  className = '',
}: ScrollTextProps) {
  const progress = useScrollSequenceProgress();

  const entryEnd = start + (end - start) * 0.25;
  const exitStart = end - (end - start) * 0.15;

  const opacity = useTransform(
    progress,
    [start, entryEnd, exitStart, end],
    [0, 1, 1, 0],
  );

  const y = useTransform(
    progress,
    [start, entryEnd, exitStart, end],
    [30, 0, 0, -20],
  );

  const positionClasses = {
    center: 'items-center justify-center text-center',
    top: 'items-start justify-center pt-20 text-center',
    bottom: 'items-end justify-center pb-20 text-center',
    left: 'items-center justify-start pl-16 text-left',
    right: 'items-center justify-end pr-16 text-right',
  };

  return (
    <motion.div
      className={`absolute inset-0 flex ${positionClasses[position]} ${className}`}
      style={{ opacity, y, willChange: 'transform, opacity' }}
    >
      {children}
    </motion.div>
  );
}

export const ScrollText = memo(ScrollTextInner);

// ---------------------------------------------------------------------------
// UTILITIES
// ---------------------------------------------------------------------------

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeInCubic(t: number): number {
  return t * t * t;
}

function getInitialTranslateY(animation: string): number {
  switch (animation) {
    case 'fade-up':
    case 'slide-up':
      return 60;
    case 'fade-down':
      return -60;
    default:
      return 0;
  }
}

function getInitialTranslateX(animation: string): number {
  switch (animation) {
    case 'fade-left':
      return -60;
    case 'fade-right':
      return 60;
    default:
      return 0;
  }
}
