'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { StripeIntegrationContent } from './components/StripeIntegrationContent';

export default function StripeIntegrationPage() {
  return (
    <ErrorBoundary componentName="StripeIntegrationPage">
      <StripeIntegrationContent />
    </ErrorBoundary>
  );
}
