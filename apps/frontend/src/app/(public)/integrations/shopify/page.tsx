'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { memo } from 'react';
import { ShopifyHero } from './components/ShopifyHero';
import { ShopifyFeatures } from './components/ShopifyFeatures';
import { ShopifyMainTabs } from './components/ShopifyMainTabs';
import { ShopifyCTA } from './components/ShopifyCTA';

function ShopifyIntegrationPageContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <ShopifyHero />
      <ShopifyFeatures />
      <ShopifyMainTabs />
      <ShopifyCTA />
    </div>
  );
}

const ShopifyIntegrationPageMemo = memo(ShopifyIntegrationPageContent);

export default function ShopifyIntegrationPage() {
  return (
    <ErrorBoundary componentName="ShopifyIntegrationPage">
      <ShopifyIntegrationPageMemo />
    </ErrorBoundary>
  );
}
