'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ApiSdkPageContent() {
  const sdks = useMemo(() => [
    {
      name: 'JavaScript / TypeScript',
      install: 'npm install @luneo/sdk\n# or\nyarn add @luneo/sdk',
      example: `import { LuneoClient } from '@luneo/sdk';

const luneo = new LuneoClient({
  apiKey: process.env.LUNEO_API_KEY
});

const design = await luneo.designs.create({
  name: 'Mon Design',
  template: 'tshirt'
});`,
      docLink: '/help/documentation/sdks/node',
      docLabel: 'Documentation complète Node.js'
    },
    {
      name: 'React',
      install: 'npm install @luneo/react',
      example: `import { ProductCustomizer } from '@luneo/react';

function MyComponent() {
  return (
    <ProductCustomizer
      apiKey={process.env.NEXT_PUBLIC_LUNEO_API_KEY}
      productId="prod_123"
    />
  );
}`,
      docLink: '/help/documentation/sdks/react',
      docLabel: 'Documentation complète React'
    },
    {
      name: 'Python',
      install: 'pip install luneo',
      example: `from luneo import LuneoClient

client = LuneoClient(api_key="your_api_key")

design = client.designs.create(
    name="Mon Design",
    template="tshirt"
)`,
      docLink: '/help/documentation/sdks/python',
      docLabel: 'Documentation complète Python'
    },
    {
      name: 'CLI',
      install: 'npm install -g @luneo/cli',
      example: `luneo auth login
luneo designs create --template tshirt
luneo designs list
luneo assets optimize model.glb`,
      docLink: '/help/documentation/cli/installation',
      docLabel: 'Documentation complète CLI'
    },
  ], []);

  return (
    <DocPageTemplate
      title="SDKs Officiels"
      description="Intégrez Luneo facilement avec nos SDKs officiels"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'API Reference', href: '/help/documentation/api-reference' },
        { label: 'SDKs', href: '/help/documentation/api-reference/sdk' }
      ]}
      relatedLinks={[
        { title: 'JavaScript SDK', href: '/help/documentation/api-reference/js-sdk', description: 'SDK JavaScript/TypeScript' },
        { title: 'React SDK', href: '/help/documentation/sdks/react', description: 'SDK React' },
        { title: 'Python SDK', href: '/help/documentation/sdks/python', description: 'SDK Python' }
      ]}
    >
      {sdks.map((sdk, index) => (
        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {sdk.name}
          </h2>
          
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto mb-4">
            <pre className="text-sm text-green-400">{sdk.install}</pre>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-sm text-green-400">{sdk.example}</pre>
          </div>

          <Link href={sdk.docLink} className="inline-block mt-4 text-purple-600 hover:text-purple-700">
            {sdk.docLabel} →
          </Link>
        </div>
      ))}
    </DocPageTemplate>
  );
}

const ApiSdkPageMemo = memo(ApiSdkPageContent);

export default function ApiSdkPage() {
  return (
    <ErrorBoundary componentName="ApiSdkPage">
      <ApiSdkPageMemo />
    </ErrorBoundary>
  );
}
