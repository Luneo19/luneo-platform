'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function PerformanceIssuesPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Performance Issues</h1>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Solutions Performance</h2>
          <div className="space-y-3 text-gray-300">
            <div className="p-3 bg-gray-900 rounded-lg">
              <p className="text-blue-400 font-semibold mb-1">⚡ Slow loading</p>
              <p className="text-sm">Enable image optimization + lazy loading</p>
            </div>
            <div className="p-3 bg-gray-900 rounded-lg">
              <p className="text-blue-400 font-semibold mb-1">⚡ Low FPS 3D</p>
              <p className="text-sm">Reduce polygons + enable LOD</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const PerformanceIssuesPageMemo = memo(PerformanceIssuesPageContent);

export default function PerformanceIssuesPage() {
  return (
    <ErrorBoundary componentName="PerformanceIssuesPage">
      <PerformanceIssuesPageMemo />
    </ErrorBoundary>
  );
}

