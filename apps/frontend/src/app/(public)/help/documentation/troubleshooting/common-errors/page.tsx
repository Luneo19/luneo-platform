'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function CommonErrorsPageContent() {
  const errors = useMemo(() => [
    { error: 'API Key Invalid', solution: 'Vérifiez votre clé dans Dashboard → Settings' },
    { error: 'Rate Limit Exceeded', solution: 'Attendez 60s ou upgradez votre plan' },
    { error: 'Product Not Found', solution: 'Vérifiez que le product_id existe' },
    { error: 'Upload Failed', solution: 'Vérifiez taille fichier < 10MB' },
  ], []);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Common Errors</h1>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><AlertCircle className="w-6 h-6 text-red-400" />Erreurs Fréquentes</h2>
          <div className="space-y-4">
            {errors.map((e, i) => (
              <div key={i} className="p-4 bg-gray-900 rounded-lg">
                <p className="text-red-400 font-semibold mb-2">❌ {e.error}</p>
                <p className="text-green-400 text-sm">✅ {e.solution}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const CommonErrorsPageMemo = memo(CommonErrorsPageContent);

export default function CommonErrorsPage() {
  return (
    <ErrorBoundary componentName="CommonErrorsPage">
      <CommonErrorsPageMemo />
    </ErrorBoundary>
  );
}

