'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Hook for animated counter
 * Animates a number from 0 to target value
 */
export function useCounter(target: number, duration: number = 2000) {
  const [count, setCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isAnimating) {
            setIsAnimating(true);
            animateCounter(target, duration, setCount);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [target, duration, isAnimating]);

  return { count, elementRef };
}

function animateCounter(
  target: number,
  duration: number,
  setCount: (value: number) => void
) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime: number) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function (easeOutQuart)
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const current = Math.floor(start + (target - start) * easeOutQuart);

    setCount(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      setCount(target);
    }
  }

  requestAnimationFrame(update);
}

export function formatNumber(num: number): string {
  if (num >= 1000) {
    return (num / 1000).toFixed(num >= 10000 ? 0 : 1) + 'K+';
  }
  return num.toString();
}
