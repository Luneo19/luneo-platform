'use client';

import React, { createContext, useContext, useState } from 'react';

interface DensityContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  density: 'comfortable' | 'compact';
  setDensity: (density: 'comfortable' | 'compact') => void;
}

const DensityContext = createContext<DensityContextType>({
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  density: 'comfortable',
  setDensity: () => {},
});

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');

  return (
    <DensityContext.Provider
      value={{ sidebarCollapsed, setSidebarCollapsed, density, setDensity }}
    >
      {children}
    </DensityContext.Provider>
  );
}

export function useDensity() {
  return useContext(DensityContext);
}
