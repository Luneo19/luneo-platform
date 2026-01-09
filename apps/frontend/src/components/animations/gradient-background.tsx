'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface GradientBackgroundProps {
  children?: ReactNode;
  className?: string;
  colors?: string[];
  animate?: boolean;
  size?: number;
}

/**
 * Animated gradient background with mesh/blob effect
 * Usage: <GradientBackground><Content /></GradientBackground>
 */
export function GradientBackground({ 
  children,
  className = '',
  colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe'],
  animate = true,
  size = 500
}: GradientBackgroundProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        {colors.map((color, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full blur-3xl opacity-30"
            style={{
              width: size,
              height: size,
              background: color,
              left: `${(i % 2) * 50}%`,
              top: `${Math.floor(i / 2) * 50}%`,
            }}
            animate={animate ? {
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
            } : {}}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>
      
      {/* Content */}
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}
