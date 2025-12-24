'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { Copy, CheckCircle } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { DocPageTemplate } from '@/components/docs/DocPageTemplate';

function ARQRCodesPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const qrCodeExample = useMemo(() => `const response = await fetch('/api/ar/qr-code', {
  method: 'POST',
  body: JSON.stringify({
    productId: 'sneaker-pro',
    arModelId: 'ar_model_123'
  })
});

const { qrCodeUrl, arUrl } = await response.json();
// qrCodeUrl: https://cdn.luneo.app/qr/abc123.png
// arUrl: https://ar.luneo.app/view/abc123`, []);

  const storeUsageSteps = useMemo(() => [
    'Imprimez le QR code généré',
    'Placez-le sur vos PLV (Publicité sur Lieu de Vente)',
    'Les clients scannent avec leur smartphone',
    'L\'expérience AR s\'ouvre immédiatement'
  ], []);

  return (
    <DocPageTemplate
      title="QR Codes AR"
      description="Générez des QR codes pour permettre l'accès rapide aux expériences AR"
      breadcrumbs={[
        { label: 'Documentation', href: '/help/documentation' },
        { label: 'AR', href: '/help/documentation/ar' },
        { label: 'QR Codes', href: '/help/documentation/ar/qr-codes' }
      ]}
      relatedLinks={[
        { title: 'Getting Started', href: '/help/documentation/ar/getting-started', description: 'Guide AR' },
        { title: 'Tracking', href: '/help/documentation/ar/tracking', description: 'Analytics AR' }
      ]}
    >
      <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Générer un QR Code</h2>
          <button
            onClick={() => copyCode(qrCodeExample, 'qr')}
            className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
          >
            {copied === 'qr' ? (
              <CheckCircle className="w-4 h-4 text-green-400" />
            ) : (
              <Copy className="w-4 h-4 text-gray-400" />
            )}
          </button>
        </div>
        <div className="bg-gray-900 rounded-lg p-4">
          <pre className="text-sm text-gray-300 overflow-x-auto">
            <code>{qrCodeExample}</code>
          </pre>
        </div>
      </Card>

      <Card className="bg-gray-800/50 border-gray-700 p-6">
        <h2 className="text-2xl font-bold mb-4">Utilisation en magasin</h2>
        <ol className="space-y-2 text-gray-300">
          {storeUsageSteps.map((step, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-400 mr-3 font-bold">{index + 1}.</span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </Card>
    </DocPageTemplate>
  );
}

const ARQRCodesPageMemo = memo(ARQRCodesPageContent);

export default function ARQRCodesPage() {
  return (
    <ErrorBoundary componentName="ARQRCodesPage">
      <ARQRCodesPageMemo />
    </ErrorBoundary>
  );
}
