'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SecurityAuthorizationPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Security - Authorization</h1>
          <p className="text-xl text-gray-400">Gestion des permissions</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Rôles</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> <strong>Owner</strong>: Tous droits</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-purple-400" /> <strong>Admin</strong>: Gestion équipe</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> <strong>Member</strong>: Créer/éditer</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-gray-400" /> <strong>Viewer</strong>: Lecture seule</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const SecurityAuthorizationPageMemo = memo(SecurityAuthorizationPageContent);

export default function SecurityAuthorizationPage() {
  return (
    <ErrorBoundary componentName="SecurityAuthorizationPage">
      <SecurityAuthorizationPageMemo />
    </ErrorBoundary>
  );
}

