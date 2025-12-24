'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Database, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DataProtectionPageContent() {
  const protections = useMemo(() => [
    { icon: <CheckCircle className="w-5 h-5 text-cyan-400" />, text: 'Encryption AES-256' },
    { icon: <CheckCircle className="w-5 h-5 text-cyan-400" />, text: 'Backups quotidiens' },
    { icon: <CheckCircle className="w-5 h-5 text-cyan-400" />, text: 'RGPD compliant' },
    { icon: <CheckCircle className="w-5 h-5 text-cyan-400" />, text: 'ISO 27001' },
  ], []);

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Data Protection</h1>
          <p className="text-xl text-gray-400">Protection des données</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-400" />
            Protection
          </h2>
          <div className="space-y-2 text-gray-300">
            {protections.map((protection, index) => (
              <div key={index} className="flex gap-2">
                {protection.icon}
                <span>{protection.text}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const DataProtectionPageMemo = memo(DataProtectionPageContent);

export default function DataProtectionPage() {
  return (
    <ErrorBoundary componentName="DataProtectionPage">
      <DataProtectionPageMemo />
    </ErrorBoundary>
  );
}
