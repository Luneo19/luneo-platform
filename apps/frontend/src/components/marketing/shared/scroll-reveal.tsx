'use client';

import React, { useEffect, useRef, useState, memo } from 'react';

// =============================================================================
// TYPES
// =============================================================================

type AnimationType = 'fade-up' | 'fade-down' | 'fade-left' | 'fade-right' | 'zoom-in' | 'zoom-out' | 'fade';

interface ScrollRevealProps {
  children: React.ReactNode;
  animation?: AnimationType;
  /** Delay in ms before animation starts after element is visible */
  delay?: number;
  /** Duration of the animation in ms */
  duration?: number;
  /** Intersection Observer threshold (0-1) */
  threshold?: number;
  /** Additional className */
  className?: string;
  /** Whether to only animate once */
  once?: boolean;
  /** Tag to render as */
  as?: keyof JSX.IntrinsicElements;
  /** Stagger index for automatic delay calculation */
  staggerIndex?: number;
  /** Base stagger delay in ms (multiplied by staggerIndex) */
  staggerDelay?: number;
}

// =============================================================================
// ANIMATION STYLES
// =============================================================================

const INITIAL_STYLES: Record<AnimationType, React.CSSProperties> = {
  'fade-up': { opacity: 0, transform: 'translateY(40px)' },
  'fade-down': { opacity: 0, transform: 'translateY(-40px)' },
  'fade-left': { opacity: 0, transform: 'translateX(-40px)' },
  'fade-right': { opacity: 0, transform: 'translateX(40px)' },
  'zoom-in': { opacity: 0, transform: 'scale(0.92)' },
  'zoom-out': { opacity: 0, transform: 'scale(1.08)' },
  'fade': { opacity: 0 },
};

const ANIMATED_STYLES: React.CSSProperties = {
  opacity: 1,
  transform: 'translate(0, 0) scale(1)',
};

// =============================================================================
// CHECK PREFERS-REDUCED-MOTION
// =============================================================================

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// =============================================================================
// SCROLL REVEAL COMPONENT
// =============================================================================

function ScrollRevealInner({
  children,
  animation = 'fade-up',
  delay = 0,
  duration = 600,
  threshold = 0.15,
  className = '',
  once = true,
  as: Tag = 'div',
  staggerIndex,
  staggerDelay = 100,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);

  // Calculate total delay including stagger
  const totalDelay = delay + (staggerIndex !== undefined ? staggerIndex * staggerDelay : 0);

  useEffect(() => {
    // If reduced motion, show immediately
    if (prefersReducedMotion()) {
      setIsVisible(true);
      setHasAnimated(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !(once && hasAnimated)) {
          setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, totalDelay);
        } else if (!once && !entry.isIntersecting) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold, once, hasAnimated, totalDelay]);

  const style: React.CSSProperties = {
    ...(isVisible ? ANIMATED_STYLES : INITIAL_STYLES[animation]),
    transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1), transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`,
    willChange: isVisible ? 'auto' : 'opacity, transform',
  };

  // FIX: ref must be on the animated element itself (not a display:contents wrapper)
  // display:contents elements have a 0x0 bounding rect, breaking IntersectionObserver
  return React.createElement(Tag, { ref, className, style, children } as React.Attributes & { ref?: React.Ref<HTMLDivElement>; className?: string; style?: React.CSSProperties });
}

export const ScrollReveal = memo(ScrollRevealInner);

// =============================================================================
// STAGGER CONTAINER - Wraps children with auto-stagger
// =============================================================================

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  animation?: AnimationType;
  staggerDelay?: number;
  baseDelay?: number;
  duration?: number;
}

function StaggerContainerInner({
  children,
  className = '',
  animation = 'fade-up',
  staggerDelay = 100,
  baseDelay = 0,
  duration = 600,
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => {
        if (!React.isValidElement(child)) return child;
        return (
          <ScrollReveal
            animation={animation}
            staggerIndex={index}
            staggerDelay={staggerDelay}
            delay={baseDelay}
            duration={duration}
          >
            {child}
          </ScrollReveal>
        );
      })}
    </div>
  );
}

export const StaggerContainer = memo(StaggerContainerInner);

// =============================================================================
// PARALLAX HOOK
// =============================================================================

export function useParallax(speed: number = 0.3) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const element = ref.current;
    if (!element) return;

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = element.getBoundingClientRect();
          const scrollProgress = rect.top / window.innerHeight;
          const offset = scrollProgress * speed * 100;
          element.style.transform = `translateY(${offset}px)`;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial position

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);

  return ref;
}

// =============================================================================
// ANIMATED COUNTER COMPONENT
// =============================================================================

interface AnimatedCounterProps {
  value: string;
  className?: string;
}

export function AnimatedCounter({ value, className = '' }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [displayValue, setDisplayValue] = useState(value);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDisplayValue(value);
      return;
    }

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);

          // Extract numeric part
          const numericMatch = value.match(/^([\d.]+)/);
          if (!numericMatch) {
            setDisplayValue(value);
            return;
          }

          const target = parseFloat(numericMatch[1]);
          const suffix = value.slice(numericMatch[1].length);
          const isDecimal = numericMatch[1].includes('.');
          const duration = 2000;
          const startTime = performance.now();

          function animate(currentTime: number) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 4); // easeOutQuart
            const current = eased * target;

            if (isDecimal) {
              setDisplayValue(current.toFixed(1) + suffix);
            } else {
              setDisplayValue(Math.floor(current).toLocaleString('fr-FR') + suffix);
            }

            if (progress < 1) {
              requestAnimationFrame(animate);
            } else {
              setDisplayValue(value);
            }
          }

          requestAnimationFrame(animate);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <span ref={ref} className={className}>
      {displayValue}
    </span>
  );
}
