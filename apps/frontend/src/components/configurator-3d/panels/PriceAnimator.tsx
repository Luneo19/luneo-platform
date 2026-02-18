'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValueEvent } from 'framer-motion';
import { useSpring } from 'framer-motion';
import { CurrencyFormatter } from '@/lib/configurator-3d/pricing/CurrencyFormatter';

export interface PriceAnimatorProps {
  value: number;
  currency: string;
  className?: string;
  compact?: boolean;
}

export function PriceAnimator({
  value,
  currency,
  className,
  compact,
}: PriceAnimatorProps) {
  const [displayValue, setDisplayValue] = useState(value);
  const spring = useSpring(value, {
    stiffness: 100,
    damping: 20,
    restDelta: 0.01,
  });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useMotionValueEvent(spring, 'change', (v) => setDisplayValue(v));

  const formatted = compact
    ? CurrencyFormatter.formatCompact(displayValue, currency)
    : CurrencyFormatter.format(displayValue, currency);

  return (
    <motion.span
      key={formatted}
      initial={{ opacity: 0.8, scale: 1.02 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {formatted}
    </motion.span>
  );
}
