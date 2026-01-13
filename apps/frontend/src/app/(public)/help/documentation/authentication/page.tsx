'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Key, Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function AuthenticationPageContent() {
  const [copied, setCopied] = React.useState<string>('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const apiKeyExample = useMemo(() => `// Utilisation d'une API Key
const response = await fetch('https://api.luneo.app/v1/products', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});`, []);

  const jwtExample = useMemo(() => `// Utilisation d'un JWT Token
const token = await getJWTToken(); // Votre méthode d'obtention du token
const response = await fetch('https://api.luneo.app/v1/designs', {
  headers: {
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json'
  }
});`, []);

  const CodeBlock = ({ code, id, title }: { code: string; id: string; title: string }) => (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-3xl font-bold">{title}</h2>
        <button
          onClick={() => copyCode(code, id)}
          className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
        >
          {copied === id ? (
            <CheckCircle className="w-4 h-4 text-green-400" />
          ) : (
            <Copy className="w-4 h-4 text-gray-400" />
          )}
        </button>
      </div>
      <div className="bg-gray-900 text-gray-100 p-4 rounded-lg">
        <pre className="overflow-x-auto">
          <code>{code}</code>
        </pre>
      </div>
    </section>
  );

  return (
    <DocPageTemplate
      title="Authentication"
      description="Sécurisez vos appels API avec tokens JWT et API Keys"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'Authentication', href: '/help/documentation/authentication' }
      ]}
      relatedLinks={[
        { title: 'API Reference', href: '/help/documentation/api-reference', description: 'Référence API' },
        { title: 'Security', href: '/help/documentation/security', description: 'Sécurité' }
      ]}
    >
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6">API Keys</h2>
        <p className="text-gray-300 mb-4">
          Luneo utilise des API keys pour authentifier les requêtes. Générez vos clés dans le dashboard.
        </p>
      </section>

      <CodeBlock code={apiKeyExample} id="apikey" title="API Key Authentication" />
      <CodeBlock code={jwtExample} id="jwt" title="JWT Token Authentication" />
    </DocPageTemplate>
  );
}

const AuthenticationPageMemo = memo(AuthenticationPageContent);

export default function AuthenticationPage() {
  return (
    <ErrorBoundary componentName="AuthenticationPage">
      <AuthenticationPageMemo />
    </ErrorBoundary>
  );
}
