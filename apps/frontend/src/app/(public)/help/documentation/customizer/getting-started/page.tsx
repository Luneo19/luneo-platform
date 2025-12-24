'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function CustomizerGettingStartedPageContent() {
  const installCode = useMemo(() => `npm install @luneo/customizer`, []);
  const usageCode = useMemo(() => `import { Customizer } from '@luneo/customizer';

<Customizer template="t-shirt" />`, []);

  return (
    <DocPageTemplate
      title="Visual Customizer - Getting Started"
      description="Le Visual Customizer est un éditeur canvas basé sur Konva.js pour créer des designs 2D."
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Customizer', href: '/help/documentation/customizer' },
        { label: 'Getting Started', href: '/help/documentation/customizer/getting-started' }
      ]}
      relatedLinks={[
        { title: 'Exemples', href: '/help/documentation/customizer/examples', description: 'Exemples de code' },
        { title: 'Configuration', href: '/help/documentation/customizer/configuration', description: 'Configuration avancée' }
      ]}
    >
      <h2 className="text-2xl font-bold mt-8 mb-4">Installation</h2>
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg mb-8">
        <pre className="text-sm overflow-x-auto">{installCode}</pre>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4">Usage</h2>
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
        <pre className="text-sm overflow-x-auto">{usageCode}</pre>
      </div>
    </DocPageTemplate>
  );
}

const CustomizerGettingStartedPageMemo = memo(CustomizerGettingStartedPageContent);

export default function CustomizerGettingStartedPage() {
  return (
    <ErrorBoundary componentName="CustomizerGettingStartedPage">
      <CustomizerGettingStartedPageMemo />
    </ErrorBoundary>
  );
}
