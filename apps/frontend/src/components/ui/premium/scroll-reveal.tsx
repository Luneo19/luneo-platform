'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';

type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'scale' | 'none';

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  distance?: number;
  threshold?: number;
  once?: boolean;
  stagger?: number;
  blur?: boolean;
}

const directionTransforms: Record<RevealDirection, string> = {
  up: 'translateY(VALpx)',
  down: 'translateY(-VALpx)',
  left: 'translateX(VALpx)',
  right: 'translateX(-VALpx)',
  scale: 'scale(0.92)',
  none: 'none',
};

export function ScrollReveal({
  children,
  className,
  direction = 'up',
  delay = 0,
  duration = 800,
  distance = 40,
  threshold = 0.15,
  once = true,
  blur = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) observer.unobserve(el);
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin: '0px 0px -50px 0px' },
    );

    observer.observe(el);
    return () => observer.unobserve(el);
  }, [threshold, once]);

  const initialTransform =
    direction === 'none'
      ? 'none'
      : directionTransforms[direction].replace('VAL', String(distance));

  return (
    <div
      ref={ref}
      className={cn('transition-all will-change-transform', className)}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : initialTransform,
        filter: blur && !isVisible ? 'blur(8px)' : 'blur(0px)',
        transitionProperty: 'opacity, transform, filter',
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

interface StaggerContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  direction?: RevealDirection;
  duration?: number;
}

export function StaggerContainer({
  children,
  className,
  staggerDelay = 100,
  direction = 'up',
  duration = 800,
}: StaggerContainerProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <ScrollReveal
          direction={direction}
          delay={index * staggerDelay}
          duration={duration}
          key={index}
        >
          {child}
        </ScrollReveal>
      ))}
    </div>
  );
}

interface ParallaxProps {
  children: React.ReactNode;
  className?: string;
  speed?: number;
  direction?: 'vertical' | 'horizontal';
}

export function Parallax({
  children,
  className,
  speed = 0.3,
  direction = 'vertical',
}: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  const handleScroll = useCallback(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const viewH = window.innerHeight;
    const progress = (viewH - rect.top) / (viewH + rect.height);
    setOffset((progress - 0.5) * 100 * speed);
  }, [speed]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const transform =
    direction === 'vertical'
      ? `translateY(${offset}px)`
      : `translateX(${offset}px)`;

  return (
    <div
      ref={ref}
      className={cn('will-change-transform', className)}
      style={{ transform }}
    >
      {children}
    </div>
  );
}
