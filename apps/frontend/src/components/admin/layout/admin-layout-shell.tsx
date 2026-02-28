'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

interface AdminLayoutShellProps {
  sidebar: React.ReactNode;
  header: React.ReactNode;
  children: React.ReactNode;
}

export const MobileSidebarContext = React.createContext<{
  open: boolean;
  toggle: () => void;
  close: () => void;
}>({ open: false, toggle: () => {}, close: () => {} });

export function AdminLayoutShell({ sidebar, header, children }: AdminLayoutShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  const toggle = useCallback(() => setSidebarOpen((v) => !v), []);
  const close = useCallback(() => setSidebarOpen(false), []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  return (
    <MobileSidebarContext.Provider value={{ open: sidebarOpen, toggle, close }}>
      <div data-admin-ui="true" className="flex h-screen bg-zinc-950 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden lg:flex">
          {sidebar}
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
              onClick={close}
              aria-hidden
            />
            <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
              {sidebar}
            </div>
          </>
        )}

        <div className="flex-1 flex flex-col min-h-0 min-w-0 overflow-hidden">
          {header}
          <main className="flex-1 overflow-y-auto overflow-x-hidden bg-zinc-900 min-h-0">
            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MobileSidebarContext.Provider>
  );
}
