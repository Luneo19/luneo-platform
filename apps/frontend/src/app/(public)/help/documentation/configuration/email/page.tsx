'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function EmailConfigPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Email Setup</h1>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">SendGrid</h2>
          <div className="space-y-2 text-gray-300 font-mono text-sm">
            <div><code>SENDGRID_API_KEY</code></div>
            <div><code>FROM_EMAIL</code></div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const EmailConfigPageMemo = memo(EmailConfigPageContent);

export default function EmailConfigPage() {
  return (
    <ErrorBoundary componentName="EmailConfigPage">
      <EmailConfigPageMemo />
    </ErrorBoundary>
  );
}

