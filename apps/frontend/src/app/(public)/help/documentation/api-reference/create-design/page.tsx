'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Code, Copy } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CreateDesignPageContent() {
  const [copied, setCopied] = React.useState(false);

  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(exampleCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const exampleCode = useMemo(() => `const response = await fetch('https://api.luneo.app/v1/designs', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    productId: 'prod_123',
    prompt: 'Créer un logo moderne pour une startup tech',
    options: {
      style: 'modern',
      colors: ['#3B82F6', '#8B5CF6'],
      format: 'png'
    }
  })
});

const design = await response.json();
logger.info('Design créé:', design.id);`, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <motion
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex items-center text-sm text-gray-400 mb-6">
            <Link href="/help/documentation" className="hover:text-white">Documentation</Link>
            <span className="mx-2">›</span>
            <Link href="/help/documentation/api-reference" className="hover:text-white">API Reference</Link>
            <span className="mx-2">›</span>
            <span className="text-white">Créer un design</span>
          </div>

          <h1 className="text-4xl font-bold mb-4">Créer un Design</h1>
          <p className="text-xl text-gray-300 mb-12">
            Apprenez à créer des designs personnalisés avec l'API Luneo.
          </p>

          <Card className="bg-gray-800 border-gray-700 p-6 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-4">
              <h3 className="text-lg font-semibold flex items-center">
                <Code className="w-5 h-5 mr-2" />
                Exemple de code
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={copyCode}
                className="border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? 'Copié !' : 'Copier'}
              </Button>
            </div>
            <pre className="bg-gray-900 rounded p-4 overflow-x-auto">
              <code className="text-sm text-gray-300">{exampleCode}</code>
            </pre>
          </Card>

          <div className="prose prose-invert max-w-none">
            <h2 className="text-2xl font-bold mt-8 mb-4">Paramètres</h2>
            <ul className="space-y-4">
              <li className="text-gray-300">
                <strong className="text-white">productId</strong> (string, requis) - L'ID du produit à personnaliser
              </li>
              <li className="text-gray-300">
                <strong className="text-white">prompt</strong> (string, requis) - Description du design souhaité
              </li>
              <li className="text-gray-300">
                <strong className="text-white">options</strong> (object, optionnel) - Options de personnalisation
              </li>
            </ul>
          </div>
        </motion>
      </div>
    </div>
  );
}

const CreateDesignPageMemo = memo(CreateDesignPageContent);

export default function CreateDesignPage() {
  return (
    <ErrorBoundary componentName="CreateDesignPage">
      <CreateDesignPageMemo />
    </ErrorBoundary>
  );
}
