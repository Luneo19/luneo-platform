'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Configurator3D } from '@/components/configurator-3d/core';
import { configurator3dEndpoints } from '@/lib/api/configurator-3d.endpoints';
import type { Configurator3DConfig } from '@/lib/configurator-3d/types/configurator.types';
import { Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Public configurator page - no auth required.
 * Full Configurator3D with brand header. Add to cart CTA goes to brand website.
 */
export default function PublicConfiguratorPage() {
  const params = useParams();
  const configId = params?.configId as string;
  const [config, setConfig] = useState<Configurator3DConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configId) {
      setError('Configuration ID is required');
      setLoading(false);
      return;
    }

    configurator3dEndpoints.configurations
      .getPublic(configId)
      .then((data) => {
        setConfig(data as Configurator3DConfig & { brand?: { name?: string; logo?: string; website?: string } });
      })
      .catch((err) => {
        setError(err?.response?.data?.message ?? 'Failed to load configurator');
      })
      .finally(() => setLoading(false));
  }, [configId]);

  const brand = (config as Configurator3DConfig & { brand?: { name?: string; logo?: string; website?: string } })?.brand;
  const brandWebsite = brand?.website;
  const brandName = brand?.name ?? 'Brand';
  const brandLogo = brand?.logo;

  if (loading) {
    return (
      <div className="flex min-h-[60vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-4 px-4">
        <p className="text-center text-muted-foreground">{error ?? 'Configuration not found'}</p>
        <Link href="/">
          <Button variant="outline">Back to home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      {/* Brand header */}
      <header className="flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:px-6">
        <Link
          href={brandWebsite ?? '/'}
          target={brandWebsite ? '_blank' : undefined}
          rel={brandWebsite ? 'noopener noreferrer' : undefined}
          className="flex items-center gap-3"
        >
          {brandLogo ? (
            <Image
              src={brandLogo}
              alt={brandName}
              width={40}
              height={40}
              className="rounded-lg object-contain"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg font-semibold">
              {brandName.charAt(0)}
            </div>
          )}
          <span className="font-semibold">{brandName}</span>
        </Link>
        {brandWebsite && (
          <a
            href={brandWebsite}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <span>Visit store</span>
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </header>

      {/* Configurator */}
      <main className="flex-1 p-4 md:p-6">
        <div className="mx-auto max-w-7xl">
          <Configurator3D
            configurationId={configId}
            className="min-h-[500px]"
            brandWebsite={brandWebsite}
          />
        </div>
      </main>
    </div>
  );
}
