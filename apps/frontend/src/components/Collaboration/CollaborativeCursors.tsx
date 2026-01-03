'use client';

/**
 * Collaborative Cursors Component
 * C-004: Curseurs collaboratifs en temps réel
 */

import { memo } from 'react';
import { LazyMotionDiv as motion, LazyAnimatePresence as AnimatePresence } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface Cursor {
  connectionId: number;
  cursor: { x: number; y: number } | null;
  name: string;
  color: string;
}

interface CollaborativeCursorsProps {
  cursors: Cursor[];
}

function CursorSVG({ color }: { color: string }) {
  return (
    <svg
      width="24"
      height="36"
      viewBox="0 0 24 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
        fill={color}
        stroke="white"
        strokeWidth="1"
      />
    </svg>
  );
}

const Cursor = memo(function Cursor({
  cursor,
  name,
  color,
}: {
  cursor: { x: number; y: number };
  name: string;
  color: string;
}) {
  return (
    <motion
      className="pointer-events-none absolute top-0 left-0"
      initial={{ scale: 0, opacity: 0 }}
      animate={{
        scale: 1,
        opacity: 1,
        x: cursor.x,
        y: cursor.y,
      }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: 'spring',
        damping: 30,
        stiffness: 500,
        mass: 0.5,
      }}
    >
      <CursorSVG color={color} />
      <div
        className="absolute left-4 top-4 px-2 py-1 rounded-md text-xs font-medium text-white whitespace-nowrap"
        style={{ backgroundColor: color }}
      >
        {name}
      </div>
    </motion>
  );
});

function CollaborativeCursorsContent({ cursors }: CollaborativeCursorsProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-50">
      <AnimatePresence>
        {cursors.map(({ connectionId, cursor, name, color }) =>
          cursor ? (
            <Cursor
              key={connectionId}
              cursor={cursor}
              name={name}
              color={color}
            />
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
}

const CollaborativeCursorsContentMemo = memo(CollaborativeCursorsContent);

export function CollaborativeCursors(props: CollaborativeCursorsProps) {
  return (
    <ErrorBoundary componentName="CollaborativeCursors">
      <CollaborativeCursorsContentMemo {...props} />
    </ErrorBoundary>
  );
}

export default CollaborativeCursors;

