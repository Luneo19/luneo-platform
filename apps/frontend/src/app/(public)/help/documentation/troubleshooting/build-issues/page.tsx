'use client';

import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';

export default function BuildIssuesPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Build Issues</h1>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Solutions</h2>
          <div className="space-y-3 text-gray-300">
            <div className="p-3 bg-gray-900 rounded-lg">
              <p className="text-yellow-400 font-semibold mb-1">⚠️ TypeScript errors</p>
              <p className="text-sm">Vérifiez tsconfig.json et types</p>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg">
              <p className="text-yellow-400 font-semibold mb-1">⚠️ Module not found</p>
              <p className="text-sm">Run: npm install</p>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg">
              <p className="text-yellow-400 font-semibold mb-1">⚠️ Out of memory</p>
              <p className="text-sm">Set: NODE_OPTIONS=--max-old-space-size=4096</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

