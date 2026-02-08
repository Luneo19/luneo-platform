'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ReactSDKPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = useMemo(() => `npm install @luneo/react
# ou
yarn add @luneo/react`, []);

  const configCode = useMemo(() => `import { LuneoProvider } from '@luneo/react';

function App() {
  return (
    <LuneoProvider apiKey="YOUR_API_KEY">
      <YourApp />
    </LuneoProvider>
  );
}`, []);

  const designEditorCode = useMemo(() => `import { DesignEditor } from '@luneo/react';

function MyEditor() {
  return (
    <DesignEditor
      template="t-shirt"
      onSave={(design) => logger.info('Saved:', design)}
    />
  );
}`, []);

  const viewer3DCode = useMemo(() => `import { Viewer3D } from '@luneo/react';

function MyViewer() {
  return (
    <Viewer3D
      modelUrl="https://luneo.app/models/design_123.glb"
      enableAR={true}
    />
  );
}`, []);

  const aiGeneratorCode = useMemo(() => `import { AIGenerator } from '@luneo/react';

function MyGenerator() {
  return (
    <AIGenerator
      prompt="Modern t-shirt design"
      onGenerate={(result) => logger.info(result)}
    />
  );
}`, []);

  const hooksCode = useMemo(() => `import { useDesigns, useCreateDesign } from '@luneo/react';

function MyComponent() {
  const { designs, loading } = useDesigns();
  const { create, creating } = useCreateDesign();
  
  const handleCreate = async () => {
    const design = await create({
      name: 'New Design',
      template: 't-shirt'
    });
  };
  
  return (
    <div>
      {designs.map(d => <div key={d.id}>{d.name}</div>)}
      <button onClick={handleCreate}>Create</button>
    </div>
  );
}`, []);

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
      title="React SDK"
      description="Intégrez Luneo dans votre app React en 5 minutes"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'SDK', href: '/help/documentation/sdk' },
        { label: 'React', href: '/help/documentation/sdk/react' }
      ]}
      relatedLinks={[
        { title: 'Vue SDK', href: '/help/documentation/sdk/vue', description: 'SDK Vue.js' },
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

      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">Composants</h2>
        <CodeBlock code={designEditorCode} id="editor" title="Design Editor" />
        <CodeBlock code={viewer3DCode} id="viewer" title="3D Viewer" />
        <CodeBlock code={aiGeneratorCode} id="ai" title="AI Generator" />
      </section>

      <section>
        <h2 className="text-3xl font-bold mb-6">Hooks</h2>
        <CodeBlock code={hooksCode} id="hooks" />
      </section>
    </DocPageTemplate>
  );
}

const ReactSDKPageMemo = memo(ReactSDKPageContent);

export default function ReactSDKPage() {
  return (
    <ErrorBoundary componentName="ReactSDKPage">
      <ReactSDKPageMemo />
    </ErrorBoundary>
  );
}
