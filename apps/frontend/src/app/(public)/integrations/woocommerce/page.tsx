'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { WooCommerceIntegrationContent } from './components/WooCommerceIntegrationContent';

export default function WooCommerceIntegrationPage() {
  return (
    <ErrorBoundary componentName="WooCommerceIntegrationPage">
      <WooCommerceIntegrationContent />
    </ErrorBoundary>
  );
}
