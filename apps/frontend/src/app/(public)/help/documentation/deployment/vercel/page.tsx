'use client';

import React, { memo } from 'react';
import { LazyMotionDiv as Motion } from '@/lib/performance/dynamic-motion';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function DeploymentVercelPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
          <Link href="/help/documentation" className="hover:text-white">Documentation</Link>
          <span>/</span>
          <span className="text-white">Deployment - Vercel</span>
        </div>

        <Motion initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-4xl font-bold mb-4">Déploiement Vercel</h1>
          <p className="text-xl text-gray-300 mb-8">
            Déployez Luneo sur Vercel avec configuration optimale.
          </p>
        </Motion>

        <Card className="bg-gray-800/50 border-gray-700 p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4">Configuration vercel.json</h2>
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`{
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "env": {
    "NEXT_PUBLIC_API_URL": "@api-url"
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        }
      ]
    }
  ]
}`}</code>
            </pre>
          </div>
        </Card>

        <Card className="bg-gray-800/50 border-gray-700 p-6">
          <h2 className="text-2xl font-bold mb-4">Déploiement</h2>
          <div className="bg-gray-900 rounded-lg p-4">
            <pre className="text-sm text-gray-300 overflow-x-auto">
              <code>{`vercel --prod`}</code>
            </pre>
          </div>
        </Card>
      </div>
    </div>
  );
}

const DeploymentVercelPageMemo = memo(DeploymentVercelPageContent);

export default function DeploymentVercelPage() {
  return (
    <ErrorBoundary componentName="DeploymentVercelPage">
      <DeploymentVercelPageMemo />
    </ErrorBoundary>
  );
}
