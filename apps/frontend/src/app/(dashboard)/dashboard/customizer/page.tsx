'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CustomizerPageView } from './components/CustomizerPageView';

export default function CustomizerPage() {
  return (
    <ErrorBoundary level="page" componentName="CustomizerPage">
      <CustomizerPageView />
    </ErrorBoundary>
  );
}
