'use client';

import { useState, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { DocsSidebar } from '@/components/docs/DocsSidebar';
import { Button } from '@/components/ui/button';

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-[#0a0a0f]">
      <DocsSidebar open={sidebarOpen} onClose={closeSidebar} />
      <main className="flex-1 min-h-screen flex flex-col">
        <div className="md:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#0a0a0f] border-b border-white/[0.06] shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={openSidebar}
            className="text-white/80 hover:text-white hover:bg-white/5"
            aria-label="Ouvrir le menu documentation"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="text-sm text-white/60">Documentation</span>
        </div>
        <div className="flex-1 px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
