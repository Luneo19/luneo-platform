import { Suspense } from 'react';
import { ShortCodeViewerClient, type ResolvedView } from './ShortCodeViewerClient';
import { Loader2 } from 'lucide-react';

import { getBackendUrl } from '@/lib/api/server-url';

const BACKEND_URL = getBackendUrl();

async function resolveShortCode(shortCode: string): Promise<{ resolved: ResolvedView | null; error: string | null }> {
  try {
    const url = `${BACKEND_URL}/api/v1/ar/view/${encodeURIComponent(shortCode)}`;
    const res = await fetch(url, { redirect: 'manual', cache: 'no-store' });

    if (res.status === 404) {
      return { resolved: null, error: 'Short link not found or expired' };
    }

    if (res.status !== 302) {
      return { resolved: null, error: 'Invalid response' };
    }

    const location = res.headers.get('location');
    if (!location) {
      return { resolved: null, error: 'Invalid response' };
    }

    let modelId: string | undefined;
    let platform: string | undefined;
    let method: string | undefined;
    try {
      const parsed = new URL(location);
      const match = parsed.pathname.match(/\/ar\/viewer\/([^/]+)/);
      modelId = match?.[1];
      platform = parsed.searchParams.get('platform') ?? undefined;
      method = parsed.searchParams.get('method') ?? undefined;
    } catch {
      // keep redirectUrl only
    }

    return {
      resolved: { redirectUrl: location, modelId, platform, method },
      error: null,
    };
  } catch (e) {
    return { resolved: null, error: 'Could not load this link' };
  }
}

interface PageProps {
  params: Promise<{ shortCode: string }>;
}

export default async function ARShortCodePage({ params }: PageProps) {
  const { shortCode } = await params;
  const { resolved, error } = await resolveShortCode(shortCode);

  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 flex items-center justify-center bg-gray-950">
          <Loader2 className="h-10 w-10 animate-spin text-white" aria-hidden />
        </div>
      }
    >
      <ShortCodeViewerClient shortCode={shortCode} resolved={resolved} error={error} />
    </Suspense>
  );
}
