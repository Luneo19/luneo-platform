'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  y?: number;
}

/**
 * Fade in animation component
 * Usage: <FadeIn delay={0.2}>Content</FadeIn>
 */
export function FadeIn({ 
  children, 
  delay = 0, 
  duration = 0.5,
  className = '',
  y = 20 
}: FadeInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-100px' }}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
