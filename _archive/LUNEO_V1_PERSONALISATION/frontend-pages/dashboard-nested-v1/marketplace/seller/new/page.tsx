/**
 * List new marketplace item - simple form
 */
import { Suspense } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ListNewItemClient } from './ListNewItemClient';

export const metadata = {
  title: 'List new item | Marketplace | Luneo',
  description: 'Add a template or asset to the marketplace',
};

export default function ListNewItemPage() {
  return (
    <ErrorBoundary level="page" componentName="ListNewItemPage">
      <Suspense fallback={<div className="p-6 text-white/60">Loading...</div>}>
        <ListNewItemClient />
      </Suspense>
    </ErrorBoundary>
  );
}
