'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { Lock, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function SecurityAuthPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm">← Documentation</Link>
          <h1 className="text-4xl font-bold text-white mb-4 mt-4">Security - Authentication</h1>
          <p className="text-xl text-gray-400">Authentification sécurisée</p>
        </div>

        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2"><Lock className="w-6 h-6 text-green-400" />Méthodes</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> OAuth 2.0 (Google, GitHub)</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> JWT Tokens</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> API Keys</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> SSO/SAML (Enterprise)</div>
          </div>
        </Card>

        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Bonnes Pratiques</h2>
          <div className="space-y-2 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Mots de passe 12+ caractères</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> 2FA activé</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Session expiration 24h</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-blue-400" /> Rate limiting strict</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const SecurityAuthPageMemo = memo(SecurityAuthPageContent);

export default function SecurityAuthPage() {
  return (
    <ErrorBoundary componentName="SecurityAuthPage">
      <SecurityAuthPageMemo />
    </ErrorBoundary>
  );
}
