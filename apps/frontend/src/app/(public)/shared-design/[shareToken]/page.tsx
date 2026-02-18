/**
 * Public Shared Design Page - No auth required
 * View saved design by share token
 */

'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Share2, Sparkles, Loader2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
interface SavedDesignData {
  id: string;
  name?: string;
  token?: string;
  savedAt: string;
  selections?: Record<string, string | string[]>;
  configurationId?: string;
  price?: number;
  calculatedPrice?: number;
  currency?: string;
  description?: string;
}

const Configurator3D = dynamic(
  () => import('@/components/configurator-3d/core/Configurator3D').then((m) => ({ default: m.Configurator3D })),
  { ssr: false }
);

export default function SharedDesignPage({ params }: { params: Promise<{ shareToken: string }> }) {
  const { shareToken } = use(params);
  const [copied, setCopied] = useState(false);

  const { data: design, isLoading, error } = useQuery({
    queryKey: ['savedDesign', shareToken],
    queryFn: () => configurator3dEndpoints.savedDesigns.getByToken<SavedDesignData>(shareToken),
  });

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleShare = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-cyan-400" />
          <p className="mt-4 text-slate-400">Loading design...</p>
        </div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <Card className="max-w-md border-slate-700 bg-slate-800/50">
          <CardHeader>
            <CardTitle className="text-slate-100">Design not found</CardTitle>
            <p className="text-slate-400">This shared design may have expired or the link is invalid.</p>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/">Go home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const configurationId = design.configurationId;
  const price = design.price ?? design.calculatedPrice;
  const currency = design.currency ?? 'EUR';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">{design.name ?? 'Shared Design'}</h1>
            {design.description && (
              <p className="mt-1 text-slate-400">{design.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-700" onClick={handleShare}>
              {copied ? 'Copied!' : <Share2 className="mr-2 h-4 w-4" />}
              {copied ? 'Copied!' : 'Share again'}
            </Button>
            {configurationId && (
              <Button asChild>
                <Link href={`/c/3d/${configurationId}`}>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Create your own
                </Link>
              </Button>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card className="overflow-hidden border-slate-700 bg-slate-800/30">
              <CardContent className="p-0">
                {configurationId ? (
                  <div className="min-h-[500px]">
                    <Configurator3D
                      configurationId={configurationId}
                      className="rounded-lg"
                    />
                  </div>
                ) : (
                  <div className="flex min-h-[400px] items-center justify-center text-slate-400">
                    <p>3D viewer requires configuration. Design saved with selections.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            {price != null && price > 0 && (
              <Card className="border-slate-700 bg-slate-800/30">
                <CardHeader>
                  <CardTitle className="text-slate-100">Price</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-cyan-400">
                    {price.toLocaleString()} {currency}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border-slate-700 bg-slate-800/30">
              <CardHeader>
                <CardTitle className="text-slate-100">Create your own</CardTitle>
                <p className="text-sm text-slate-400">
                  Customize this design with your own choices. Start from scratch or use this as inspiration.
                </p>
              </CardHeader>
              <CardContent>
                {configurationId ? (
                  <Button className="w-full" asChild>
                    <Link href={`/c/3d/${configurationId}`}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Open configurator
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full" asChild>
                    <Link href="/">
                      Explore configurators
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
