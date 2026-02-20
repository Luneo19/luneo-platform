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

  // #region agent log
  useEffect(() => {
    const main = document.querySelector('main');
    const outerDiv = main?.parentElement;
    const rootDiv = outerDiv?.parentElement;
    const dims = {
      pathname,
      viewport: { w: window.innerWidth, h: window.innerHeight },
      rootDiv: rootDiv ? { h: rootDiv.clientHeight, scrollH: rootDiv.scrollHeight, overflow: getComputedStyle(rootDiv).overflow, className: rootDiv.className } : null,
      outerDiv: outerDiv ? { h: outerDiv.clientHeight, scrollH: outerDiv.scrollHeight, overflow: getComputedStyle(outerDiv).overflow, className: outerDiv.className } : null,
      main: main ? { h: main.clientHeight, scrollH: main.scrollHeight, overflow: getComputedStyle(main).overflowY, className: main.className } : null,
      canScroll: main ? main.scrollHeight > main.clientHeight : false,
    };
    fetch('http://127.0.0.1:7242/ingest/74bd0f02-b590-4981-b131-04808be8021c',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'249815'},body:JSON.stringify({sessionId:'249815',location:'admin-layout-shell.tsx:30',message:'AdminLayoutShell DOM diagnostics',data:dims,timestamp:Date.now(),hypothesisId:'H5'})}).catch(()=>{});
  }, [pathname, sidebarOpen]);
  // #endregion

  return (
    <MobileSidebarContext.Provider value={{ open: sidebarOpen, toggle, close }}>
      <div className="flex h-screen bg-zinc-950 overflow-hidden">
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

        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          {header}
          <main className="flex-1 overflow-y-auto bg-zinc-900 min-h-0">
            <div className="p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </MobileSidebarContext.Provider>
  );
}
