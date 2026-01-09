'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FloatingElementsProps {
  children: ReactNode;
  intensity?: number;
  duration?: number;
  delay?: number;
  className?: string;
}

/**
 * Floating animation - gentle up/down movement
 * Usage: <FloatingElements>Content</FloatingElements>
 */
export function FloatingElements({ 
  children, 
  intensity = 10,
  duration = 3,
  delay = 0,
  className = ''
}: FloatingElementsProps) {
  return (
    <motion.div
      animate={{
        y: [0, -intensity, 0],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
