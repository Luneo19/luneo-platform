'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface SlideUpProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
  distance?: number;
}

/**
 * Slide up animation component
 * Usage: <SlideUp delay={0.2} distance={30}>Content</SlideUp>
 */
export function SlideUp({ 
  children, 
  delay = 0, 
  duration = 0.6,
  className = '',
  distance = 30 
}: SlideUpProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
