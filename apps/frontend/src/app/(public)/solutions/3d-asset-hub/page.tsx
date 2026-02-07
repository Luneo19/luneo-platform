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

export default function AssetHubPage() {
  return (
    <ErrorBoundary level="page" componentName="AssetHubPage">
      <>
        <AssetHubHero />
        <div className="min-h-screen bg-white text-gray-900">
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
