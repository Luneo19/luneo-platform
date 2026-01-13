'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { logger } from '../../../../../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AngularSDKPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const installCode = useMemo(() => `npm install @luneo/angular
# ou
yarn add @luneo/angular`, []);

  const configCode = useMemo(() => `import { NgModule } from '@angular/core';
import { LuneoModule } from '@luneo/angular';

@NgModule({
  imports: [
    LuneoModule.forRoot({
      apiKey: 'YOUR_API_KEY'
    })
  ]
})
export class AppModule { }`, []);

  const usageCode = useMemo(() => `import { Component } from '@angular/core';
import { LuneoService } from '@luneo/angular';

@Component({
  selector: 'app-editor',
  template: \`
    <luneo-editor
      [template]="'t-shirt'"
      (save)="onSave($event)"
    ></luneo-editor>
  \`
})
export class EditorComponent {
  constructor(private luneo: LuneoService) {}
  
  onSave(design: any) {
    logger.info('Saved:', design);
  }
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
      title="Angular SDK"
      description="Intégrez Luneo dans votre app Angular"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'SDK', href: '/help/documentation/sdk' },
        { label: 'Angular', href: '/help/documentation/sdk/angular' }
      ]}
      relatedLinks={[
        { title: 'React SDK', href: '/help/documentation/sdk/react', description: 'SDK React' },
        { title: 'Vue SDK', href: '/help/documentation/sdk/vue', description: 'SDK Vue.js' }
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
        <h2 className="text-3xl font-bold mb-6">Utilisation</h2>
        <CodeBlock code={usageCode} id="usage" />
      </section>
    </DocPageTemplate>
  );
}

const AngularSDKPageMemo = memo(AngularSDKPageContent);

export default function AngularSDKPage() {
  return (
    <ErrorBoundary componentName="AngularSDKPage">
      <AngularSDKPageMemo />
    </ErrorBoundary>
  );
}
