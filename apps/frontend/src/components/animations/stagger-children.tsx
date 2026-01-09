'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

/**
 * Stagger children animation container
 * Usage: <StaggerChildren><div>Item 1</div><div>Item 2</div></StaggerChildren>
 */
export function StaggerChildren({ 
  children, 
  staggerDelay = 0.1,
  className = '' 
}: StaggerChildrenProps) {
  return (
    <motion.div
      variants={{
        ...container,
        show: {
          ...container.show,
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-100px' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const StaggerItem = ({ children, ...props }: any) => {
  return (
    <motion.div variants={item} {...props}>
      {children}
    </motion.div>
  );
};
