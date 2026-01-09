'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface TextRevealProps {
  children: ReactNode | string;
  delay?: number;
  className?: string;
  splitBy?: 'word' | 'character' | 'line';
  duration?: number;
}

/**
 * Text reveal animation - reveals text word by word or character by character
 * Usage: <TextReveal splitBy="word">Your text here</TextReveal>
 */
export function TextReveal({ 
  children, 
  delay = 0,
  className = '',
  splitBy = 'word',
  duration = 0.5
}: TextRevealProps) {
  const text = typeof children === 'string' ? children : String(children);
  
  const words = text.split(' ');
  const characters = text.split('');
  const lines = text.split('\n');

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: splitBy === 'character' ? 0.02 : 0.05,
        delayChildren: delay,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  if (splitBy === 'word') {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className={className}
      >
        {words.map((word, i) => (
          <motion.span
            key={i}
            variants={item}
            style={{ display: 'inline-block', marginRight: '0.25em' }}
          >
            {word}
          </motion.span>
        ))}
      </motion.div>
    );
  }

  if (splitBy === 'character') {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className={className}
      >
        {characters.map((char, i) => (
          <motion.span
            key={i}
            variants={item}
            style={{ display: 'inline-block' }}
          >
            {char === ' ' ? '\u00A0' : char}
          </motion.span>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className={className}
    >
      {lines.map((line, i) => (
        <motion.div key={i} variants={item}>
          {line}
        </motion.div>
      ))}
    </motion.div>
  );
}
