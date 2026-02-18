'use client';

import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { Configurator3DProvider } from './Configurator3DProvider';
import { Configurator3DCanvas } from './Configurator3DCanvas';
import { Configurator3DUI } from './Configurator3DUI';
import { cn } from '@/lib/utils';

export interface Configurator3DProps {
  configurationId: string;
  projectId?: string;
  className?: string;
  /** When set, Add to cart redirects to this URL (for public/shared configurator) */
  brandWebsite?: string;
}

/**
 * Configurator3D - Main component combining provider, canvas, and UI
 */
export function Configurator3D({
  configurationId,
  projectId,
  className,
  brandWebsite,
}: Configurator3DProps) {
  const handleSceneReady = useCallback(() => {
    // Optional: analytics, etc.
  }, []);

  return (
    <Configurator3DProvider
      configurationId={configurationId}
      projectId={projectId}
      className={className}
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={cn(
          'relative flex h-full min-h-[500px] w-full flex-col overflow-hidden rounded-xl border bg-muted/30 lg:flex-row',
          className
        )}
      >
        {/* 3D Canvas - main viewport */}
        <div className="relative flex-1">
          <Configurator3DCanvas onSceneReady={handleSceneReady} />
        </div>

        {/* UI overlay - absolute positioned */}
        <div className="absolute inset-0 flex pointer-events-none">
          <Configurator3DUI configurationId={configurationId} brandWebsite={brandWebsite} />
        </div>
      </motion.div>
    </Configurator3DProvider>
  );
}
