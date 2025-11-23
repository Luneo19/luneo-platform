'use client';

import { DocsSidebar } from '@/components/docs/DocsSidebar';

export default function DocumentationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-gray-900">
      <DocsSidebar />
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}
