'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { PrintfulIntegrationContent } from './components/PrintfulIntegrationContent';

export default function PrintfulIntegrationPage() {
  return (
    <ErrorBoundary componentName="PrintfulIntegrationPage">
      <PrintfulIntegrationContent />
    </ErrorBoundary>
  );
}
