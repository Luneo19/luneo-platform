'use client';

import React, { useCallback, useState } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

type SheetState = 'collapsed' | 'half' | 'full';

const HEIGHTS: Record<SheetState, string> = {
  collapsed: '15%',
  half: '50%',
  full: '90%',
};

const STATE_ORDER: SheetState[] = ['collapsed', 'half', 'full'];

export interface BottomSheetProps {
  children: React.ReactNode;
  defaultState?: SheetState;
  onStateChange?: (state: SheetState) => void;
  className?: string;
  dragHandleClassName?: string;
}

export function BottomSheet({
  children,
  defaultState = 'half',
  onStateChange,
  className,
  dragHandleClassName,
}: BottomSheetProps) {
  const [state, setState] = useState<SheetState>(defaultState);

  const goTo = useCallback(
    (s: SheetState) => {
      setState(s);
      onStateChange?.(s);
    },
    [onStateChange]
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const velocity = info.velocity.y;
      const offset = info.offset.y;
      const threshold = 50;

      if (velocity > 300 || offset > threshold) {
        const idx = STATE_ORDER.indexOf(state);
        goTo(STATE_ORDER[Math.max(0, idx - 1)] ?? 'collapsed');
      } else if (velocity < -300 || offset < -threshold) {
        const idx = STATE_ORDER.indexOf(state);
        goTo(STATE_ORDER[Math.min(STATE_ORDER.length - 1, idx + 1)] ?? 'full');
      }
    },
    [state, goTo]
  );

  const handleTap = useCallback(() => {
    const idx = STATE_ORDER.indexOf(state);
    const next = STATE_ORDER[(idx + 1) % STATE_ORDER.length];
    goTo(next ?? 'half');
  }, [state, goTo]);

  return (
    <motion.div
      className={cn(
        'fixed inset-x-0 bottom-0 z-40 flex flex-col rounded-t-2xl border-t bg-background shadow-xl',
        className
      )}
      initial={false}
      animate={{ height: HEIGHTS[state] }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
    >
      <div
        className={cn(
          'flex touch-pan-y cursor-grab justify-center py-3 active:cursor-grabbing',
          dragHandleClassName
        )}
        onClick={handleTap}
      >
        <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
      </div>
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {children}
      </div>
    </motion.div>
  );
}
