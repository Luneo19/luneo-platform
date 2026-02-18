'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useCanvasStore } from '@/stores/customizer';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamic import for SSR safety
const KonvaCanvas = dynamic(() => import('../canvas/KonvaCanvas').then((mod) => ({ default: mod.KonvaCanvas })), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <Skeleton className="h-full w-full" />
    </div>
  ),
});

interface CustomizerCanvasProps {
  className?: string;
}

/**
 * CustomizerCanvas - Main canvas wrapper with resize handling
 * Dynamically imports KonvaCanvas for SSR safety
 */
export function CustomizerCanvas({ className }: CustomizerCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { setCanvasSize } = useCanvasStore();

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
      setCanvasSize(rect.width, rect.height);
    };

    // Initial size
    updateDimensions();

    // ResizeObserver for responsive sizing
    const resizeObserver = new ResizeObserver(updateDimensions);
    resizeObserver.observe(container);

    // Window resize fallback
    window.addEventListener('resize', updateDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateDimensions);
    };
  }, [setCanvasSize]);

  return (
    <div
      ref={containerRef}
      className={`flex h-full w-full items-center justify-center overflow-hidden bg-gray-100 ${className || ''}`}
    >
      {dimensions.width > 0 && dimensions.height > 0 && <KonvaCanvas />}
    </div>
  );
}
