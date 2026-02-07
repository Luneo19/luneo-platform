'use client';

import React from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Configurator3DContent } from './components/Configurator3DContent';

export default function Configurator3DPage() {
  return (
    <ErrorBoundary level="page" componentName="Configurator3DPage">
      <Configurator3DContent />
    </ErrorBoundary>
  );
}
