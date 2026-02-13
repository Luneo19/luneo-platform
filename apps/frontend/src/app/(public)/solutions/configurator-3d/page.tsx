'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Configurator3DContent } from './components/Configurator3DContent';

export default function Configurator3DPage() {
  return (
    <ErrorBoundary level="page" componentName="Configurator3DPage">
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Luneo 3D Configurator',
              description: 'Configure and customize products in 3D with real-time preview and AR integration',
              applicationCategory: 'DesignApplication',
              operatingSystem: 'Web',
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app'}/solutions/configurator-3d`,
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'EUR',
                description: 'Free tier available',
              },
              provider: {
                '@type': 'Organization',
                name: 'Luneo',
                url: process.env.NEXT_PUBLIC_APP_URL || 'https://luneo.app',
              },
            }),
          }}
        />
        <Configurator3DContent />
      </>
    </ErrorBoundary>
  );
}
