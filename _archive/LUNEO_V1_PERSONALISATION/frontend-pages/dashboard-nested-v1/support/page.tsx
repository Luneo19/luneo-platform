'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { SupportPageContent } from './components/SupportPageContent';

export default function SupportPage() {
  return (
    <ErrorBoundary level="page" componentName="SupportPage">
      <SupportPageContent />
    </ErrorBoundary>
  );
}
