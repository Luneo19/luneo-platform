'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { DensityMode } from '@/styles/dashboard-tokens';

interface DensityContextValue {
  density: DensityMode;
  setDensity: (mode: DensityMode) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
}

const DensityContext = createContext<DensityContextValue>({
  density: 'comfort',
  setDensity: () => {},
  sidebarCollapsed: false,
  setSidebarCollapsed: () => {},
  toggleSidebar: () => {},
});

export function useDensity() {
  return useContext(DensityContext);
}

export function DensityProvider({ children }: { children: React.ReactNode }) {
  const [density, setDensityState] = useState<DensityMode>('comfort');
  const [sidebarCollapsed, setSidebarCollapsedState] = useState(false);

  // Restore from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('luneo-density');
      if (saved && ['compact', 'comfort', 'spacious'].includes(saved)) {
        setDensityState(saved as DensityMode);
      }
      const sidebarSaved = localStorage.getItem('luneo-sidebar-collapsed');
      if (sidebarSaved !== null) {
        setSidebarCollapsedState(sidebarSaved === 'true');
      }
    } catch {
      // localStorage not available
    }
  }, []);

  const setDensity = useCallback((mode: DensityMode) => {
    setDensityState(mode);
    try { localStorage.setItem('luneo-density', mode); } catch {}
  }, []);

  const setSidebarCollapsed = useCallback((collapsed: boolean) => {
    setSidebarCollapsedState(collapsed);
    try { localStorage.setItem('luneo-sidebar-collapsed', String(collapsed)); } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsedState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('luneo-sidebar-collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

  // Apply density class to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('density-compact', 'density-spacious');
    if (density === 'compact') root.classList.add('density-compact');
    if (density === 'spacious') root.classList.add('density-spacious');
  }, [density]);

  return (
    <DensityContext.Provider value={{ density, setDensity, sidebarCollapsed, setSidebarCollapsed, toggleSidebar }}>
      {children}
    </DensityContext.Provider>
  );
}
