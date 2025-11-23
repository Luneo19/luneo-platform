'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface LazySectionProps {
  children: ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
  delay?: number;
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale' | 'none';
  stagger?: number;
  once?: boolean;
  fallback?: ReactNode;
}

const animations = {
  fadeIn: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  slideUp: {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 },
  },
  slideLeft: {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
  },
  slideRight: {
    hidden: { opacity: 0, x: -50 },
    visible: { opacity: 1, x: 0 },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
  },
  none: {
    hidden: { opacity: 1 },
    visible: { opacity: 1 },
  },
};

export const LazySection: React.FC<LazySectionProps> = ({
  children,
  className = '',
  threshold = 0.1,
  rootMargin = '50px',
  delay = 0,
  animation = 'fadeIn',
  stagger = 0,
  once = true,
  fallback = null,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasAnimated, setHasAnimated] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasAnimated && once) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true);
            setHasAnimated(true);
          }, delay);
          
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, [threshold, rootMargin, delay, once, hasAnimated]);

  const animationConfig = animations[animation];

  return (
    <div ref={sectionRef} className={className}>
      {!isVisible && fallback ? (
        fallback
      ) : (
        <motion.div
          initial="hidden"
          animate={isVisible ? "visible" : "hidden"}
          variants={animationConfig}
          transition={{
            duration: 0.6,
            ease: [0.25, 0.46, 0.45, 0.94],
            staggerChildren: stagger,
          }}
        >
          {children}
        </motion.div>
      )}
    </div>
  );
};

// Composant pour les listes avec stagger
export const LazyList: React.FC<{
  items: ReactNode[];
  className?: string;
  itemClassName?: string;
  animation?: 'fadeIn' | 'slideUp' | 'slideLeft' | 'slideRight' | 'scale';
  stagger?: number;
  threshold?: number;
}> = ({
  items,
  className = '',
  itemClassName = '',
  animation = 'slideUp',
  stagger = 0.1,
  threshold = 0.1,
}) => {
  return (
    <LazySection
      className={className}
      animation="none"
      threshold={threshold}
      stagger={stagger}
    >
      <motion.div
        initial="hidden"
        animate="visible"
        variants={animations[animation]}
        transition={{ staggerChildren: stagger }}
      >
        {items.map((item, index) => (
          <motion.div
            key={index}
            variants={animations[animation]}
            className={itemClassName}
          >
            {item}
          </motion.div>
        ))}
      </motion.div>
    </LazySection>
  );
};

// Hook pour détecter la visibilité
export const useIntersectionObserver = (
  ref: React.RefObject<HTMLElement>,
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      options
    );

    observer.observe(ref.current);

    return () => observer.disconnect();
  }, [ref, options]);

  return isIntersecting;
};

export default LazySection;


