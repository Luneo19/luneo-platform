'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { logger } from '../../../../../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function VueSDKPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = useMemo(() => `npm install @luneo/vue
# ou
yarn add @luneo/vue`, []);

  const configCode = useMemo(() => `import { createApp } from 'vue';
import { LuneoPlugin } from '@luneo/vue';

const app = createApp(App);
app.use(LuneoPlugin, {
  apiKey: 'YOUR_API_KEY'
});
app.mount('#app');`, []);

  const componentCode = useMemo(() => `<template>
  <luneo-editor
    template="t-shirt"
    @save="onSave"
  />
</template>

<script setup>
const onSave = (design) => {
  logger.info('Saved:', design);
};
</script>`, []);

  const CodeBlock = ({ code, id, title }: { code: string; id: string; title?: string }) => (
    <div className="mb-6">
      {title && <h3 className="text-2xl font-bold mb-4">{title}</h3>}
      <div className="relative">
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
          <pre className="overflow-x-auto">
            <code>{code}</code>
          </pre>
        </div>
        <button
          onClick={() => copyCode(code, id)}
          className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
        >
          {copied === id ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <DocPageTemplate
      title="Vue SDK"
      description="Intégrez Luneo dans votre app Vue.js"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'SDK', href: '/help/documentation/sdk' },
        { label: 'Vue', href: '/help/documentation/sdk/vue' }
      ]}
      relatedLinks={[
        { title: 'React SDK', href: '/help/documentation/sdk/react', description: 'SDK React' },
        { title: 'Angular SDK', href: '/help/documentation/sdk/angular', description: 'SDK Angular' }
      ]}
    >
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Installation</h2>
        <CodeBlock code={installCode} id="install" />
      </section>

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Configuration</h2>
        <CodeBlock code={configCode} id="config" />
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6">Composants</h2>
        <CodeBlock code={componentCode} id="component" />
      </section>
    </DocPageTemplate>
  );
}

const VueSDKPageMemo = memo(VueSDKPageContent);

export default function VueSDKPage() {
  return (
    <ErrorBoundary componentName="VueSDKPage">
      <VueSDKPageMemo />
    </ErrorBoundary>
  );
}
