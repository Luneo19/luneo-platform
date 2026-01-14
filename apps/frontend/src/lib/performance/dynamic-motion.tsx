/**
 * Dynamic Motion Components
 * Optimized lazy loading for framer-motion library (~50KB)
 */

import dynamic from 'next/dynamic';

// Framer Motion components (heavy: ~50KB)
export const LazyMotion = dynamic(
  // @ts-expect-error - framer-motion motion is not a standard React component
  () => import('framer-motion').then(mod => ({ default: mod.motion })),
  { ssr: false }
) as any;

export const LazyAnimatePresence = dynamic(
  // @ts-expect-error - framer-motion AnimatePresence type compatibility
  () => import('framer-motion').then(mod => ({ default: mod.AnimatePresence })),
  { ssr: false }
) as any;

// Helper to create lazy motion components
export const createLazyMotion = (component: string) => {
  return dynamic(
    () => import('framer-motion').then(mod => {
      const MotionComponent = mod.motion[component as keyof typeof mod.motion];
      return { default: MotionComponent };
    }),
    { ssr: false }
  );
};

// Pre-configured lazy motion components
export const LazyMotionDiv = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.div })),
  { ssr: false }
);

export const LazyMotionSection = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.section })),
  { ssr: false }
);

export const LazyMotionArticle = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.article })),
  { ssr: false }
);

export const LazyMotionButton = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.button })),
  { ssr: false }
);

export const LazyMotionSpan = dynamic(
  () => import('framer-motion').then(mod => ({ default: mod.motion.span })),
  { ssr: false }
);

