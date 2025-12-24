'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function ProductionConfigPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Production Checklist</h1>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Checklist</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Env variables configurées</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Build local OK</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Tests passés</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Domain configuré</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> SSL activé</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const ProductionConfigPageMemo = memo(ProductionConfigPageContent);

export default function ProductionConfigPage() {
  return (
    <ErrorBoundary componentName="ProductionConfigPage">
      <ProductionConfigPageMemo />
    </ErrorBoundary>
  );
}

