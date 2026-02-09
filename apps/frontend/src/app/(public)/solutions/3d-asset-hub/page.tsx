'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CTASectionNew } from '@/components/marketing/home';
import { AssetHubHero } from './components/AssetHubHero';
import { AssetHubStats } from './components/AssetHubStats';
import { AssetHubHowItWorks } from './components/AssetHubHowItWorks';
import { AssetHubFeatures } from './components/AssetHubFeatures';
import { AssetHubDeploy } from './components/AssetHubDeploy';
import { AssetHubTechnicalSpecs } from './components/AssetHubTechnicalSpecs';
import { AssetHubIndustries } from './components/AssetHubIndustries';
import { AssetHubPricing } from './components/AssetHubPricing';
import { AssetHubComparison } from './components/AssetHubComparison';
import { AssetHubIntegration } from './components/AssetHubIntegration';
import { AssetHubCTA } from './components/AssetHubCTA';
import { AssetHubFAQ } from './components/AssetHubFAQ';

// Canonical URL for SEO/JSON-LD. Next.js metadata must be statically analyzable, so we use a constant instead of process.env here.
const APP_URL = 'https://luneo.app';

export default function AssetHubPage() {
  return (
    <ErrorBoundary level="page" componentName="AssetHubPage">
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Luneo 3D Asset Hub',
              description: 'Manage, organize and distribute 3D assets for product visualization',
              applicationCategory: 'DesignApplication',
              operatingSystem: 'Web',
              url: `${APP_URL}/solutions/3d-asset-hub`,
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'EUR',
                description: 'Free tier available',
              },
              provider: {
                '@type': 'Organization',
                name: 'Luneo',
                url: APP_URL,
              },
            }),
          }}
        />
        <AssetHubHero />
        <div className="min-h-screen dark-section relative noise-overlay">
          <div className="absolute inset-0 gradient-mesh-purple" />
          <AssetHubStats />
          <AssetHubHowItWorks />
          <AssetHubFeatures />
          <AssetHubDeploy />
          <AssetHubTechnicalSpecs />
          <AssetHubIndustries />
          <AssetHubPricing />
          <AssetHubComparison />
          <AssetHubIntegration />
          <AssetHubCTA />
          <AssetHubFAQ />
          <CTASectionNew />
        </div>
      </>
    </ErrorBoundary>
  );
}
