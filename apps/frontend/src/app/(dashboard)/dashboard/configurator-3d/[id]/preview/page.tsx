/**
 * Preview Page - Full configurator with device toggle
 */

'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { ChevronLeft, Monitor, Tablet, Smartphone, ExternalLink, Share2 } from 'lucide-react';
import dynamic from 'next/dynamic';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import type { Configurator3DConfig } from '@/lib/configurator-3d/types/configurator.types';

const Configurator3D = dynamic(
  () => import('@/components/configurator-3d/core/Configurator3D').then((m) => ({ default: m.Configurator3D })),
  { ssr: false }
);

type Device = 'desktop' | 'tablet' | 'mobile';

const DEVICE_WIDTHS: Record<Device, number> = {
  desktop: 1200,
  tablet: 768,
  mobile: 375,
};

export default function PreviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { toast } = useToast();
  const [device, setDevice] = useState<Device>('desktop');

  const { data: config, isLoading } = useQuery({
    queryKey: ['configurator3d', 'config', id],
    queryFn: () => configurator3dEndpoints.configurations.get<Configurator3DConfig>(id),
  });

  const previewUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/configurator-3d/${id}/preview` : '';

  const copyPreviewLink = () => {
    navigator.clipboard.writeText(previewUrl);
    toast({ title: 'Link copied to clipboard' });
  };

  if (isLoading || !config) {
    return (
      <div className="flex min-h-[400px] items-center justify-center p-6">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <header className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/dashboard/configurator-3d/${id}`}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              Back
            </Link>
          </Button>
          <h1 className="font-semibold">Preview: {config.name}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border p-1">
            <Button
              variant={device === 'desktop' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDevice('desktop')}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={device === 'tablet' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDevice('tablet')}
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={device === 'mobile' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setDevice('mobile')}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={copyPreviewLink}>
            <Share2 className="mr-2 h-4 w-4" />
            Copy link
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={previewUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-2 h-4 w-4" />
              Open in new tab
            </a>
          </Button>
        </div>
      </header>

      <div className="flex flex-1 items-center justify-center overflow-auto bg-muted/30 p-4">
        <div
          className="overflow-hidden rounded-lg border bg-background shadow-lg transition-all"
          style={{ width: DEVICE_WIDTHS[device], maxWidth: '100%' }}
        >
          <div className="min-h-[500px]">
            <Configurator3D configurationId={id} />
          </div>
        </div>
      </div>
    </div>
  );
}
