'use client';

import React, { memo, useMemo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function BuildIssuesPageContent() {
  const issues = useMemo(() => [
    { 
      emoji: '⚠️', 
      title: 'TypeScript errors', 
      solution: 'Vérifiez tsconfig.json et types',
      color: 'text-yellow-400'
    },
    { 
      emoji: '⚠️', 
      title: 'Module not found', 
      solution: 'Run: npm install',
      color: 'text-yellow-400'
    },
    { 
      emoji: '⚠️', 
      title: 'Out of memory', 
      solution: 'Set: NODE_OPTIONS=--max-old-space-size=4096',
      color: 'text-yellow-400'
    },
  ], []);

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
            {issues.map((issue, index) => (
              <div key={index} className="p-3 bg-gray-900 rounded-lg">
                <p className={`${issue.color} font-semibold mb-1`}>
                  {issue.emoji} {issue.title}
                </p>
                <p className="text-sm">{issue.solution}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

const BuildIssuesPageMemo = memo(BuildIssuesPageContent);

export default function BuildIssuesPage() {
  return (
    <ErrorBoundary componentName="BuildIssuesPage">
      <BuildIssuesPageMemo />
    </ErrorBoundary>
  );
}
