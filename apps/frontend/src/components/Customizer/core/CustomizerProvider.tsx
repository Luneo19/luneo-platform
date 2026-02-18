'use client';

import { createContext, useContext, useEffect, useRef, ReactNode } from 'react';
import { CustomizerEngine } from '@/lib/customizer';
import type { ZoneConfig } from '@/lib/customizer';
import type { CustomizerConfig, CustomizerZone } from '@/stores/customizer';
import { logger } from '@/lib/logger';

interface CustomizerContextValue {
  engine: CustomizerEngine | null;
}

const CustomizerContext = createContext<CustomizerContextValue | null>(null);

export function useCustomizerContext() {
  const context = useContext(CustomizerContext);
  if (!context) {
    throw new Error('useCustomizerContext must be used within CustomizerProvider');
  }
  return context;
}

function mapCustomizerZoneToZoneConfig(zone: CustomizerZone): ZoneConfig {
  return {
    id: zone.id,
    name: zone.name,
    type: 'rect',
    shape: {
      x: zone.x,
      y: zone.y,
      width: zone.width,
      height: zone.height,
    },
    constraints: zone.constraints,
  };
}

interface CustomizerProviderProps {
  config: CustomizerConfig;
  children: ReactNode;
}

/**
 * CustomizerProvider - Provides CustomizerEngine instance via React context
 * Initializes engine with config and handles cleanup
 */
export function CustomizerProvider({ config, children }: CustomizerProviderProps) {
  const engineRef = useRef<CustomizerEngine | null>(null);

  useEffect(() => {
    const zones: ZoneConfig[] = config.zones.map(mapCustomizerZoneToZoneConfig);

    // Create engine instance
    const engine = new CustomizerEngine({
      zones,
      canvas: {
        width: config.canvas?.width || 800,
        height: config.canvas?.height || 800,
        backgroundColor: config.canvas?.backgroundColor,
        backgroundImage: config.canvas?.backgroundImage,
      },
      history: {
        maxSize: config.history?.maxSize || 100,
      },
    });

    engineRef.current = engine;
    logger.info('CustomizerEngine initialized', { config });

    // Cleanup on unmount
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
        logger.info('CustomizerEngine disposed');
      }
    };
  }, [config]);

  const value: CustomizerContextValue = {
    engine: engineRef.current,
  };

  return <CustomizerContext.Provider value={value}>{children}</CustomizerContext.Provider>;
}
