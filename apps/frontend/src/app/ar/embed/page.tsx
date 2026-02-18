import { Suspense } from 'react';
import { EmbedViewerClient } from './EmbedViewerClient';

export const dynamic = 'force-dynamic';

export default function AREmbedPage() {
  return (
    <Suspense fallback={<div className="flex h-full min-h-[400px] items-center justify-center bg-gray-950"><span className="text-gray-500">Loading…</span></div>}>
      <EmbedViewerClient />
    </Suspense>
  );
}
