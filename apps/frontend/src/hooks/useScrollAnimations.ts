'use client';

import { useEffect, useState } from 'react';

/**
 * Hook for scroll-based animations
 * Animates elements when they come into view
 */
export function useScrollAnimations() {
  const [animatedElements, setAnimatedElements] = useState<Set<Element>>(new Set());

  useEffect(() => {
    const elements = document.querySelectorAll('[data-animate]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const delay = parseInt(entry.target.getAttribute('data-delay') || '0', 10);
            setTimeout(() => {
              entry.target.classList.add('animated');
              setAnimatedElements((prev) => new Set(prev).add(entry.target));
            }, delay);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => {
      elements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  return animatedElements;
}
