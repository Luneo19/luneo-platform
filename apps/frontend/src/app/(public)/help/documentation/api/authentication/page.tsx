'use client';

import React, { memo, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Key, Shield, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '../../../../../../lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function APIAuthenticationPageContent() {
  const [copied, setCopied] = React.useState('');

  const copyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  }, []);

  const authExample = useMemo(() => `// API Authentication
const response = await fetch('https://api.luneo.app/v1/products', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});`, []);

  const oauthExample = `// OAuth 2.0 Flow
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const { data, error } = await supabase.auth.signInWithOAuth({
  provider: 'google'
});`;

  const jwtExample = `// JWT Verification
const jwt = require('jsonwebtoken');

const token = req.headers.authorization?.split(' ')[1];
const decoded = jwt.verify(token, process.env.JWT_SECRET);
logger.info('User ID:', decoded.sub);`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">API Authentication</h1>
          <p className="text-xl text-gray-400">Authentifiez vos requêtes API</p>
        </div>

        {/* API Key Method */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Key className="w-6 h-6 text-yellow-400" />
            Méthode 1: API Key (Recommandé)
          </h2>
          
          <p className="text-gray-300 mb-4">Utilisez votre clé API dans le header Authorization:</p>
          
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {authExample}
            </pre>
            <button
              onClick={() => copyCode(authExample, 'auth')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'auth' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>

          <div className="mt-4 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm flex gap-2">
              <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
              Votre clé API est disponible dans Dashboard → Settings → API Keys
            </p>
          </div>
        </Card>

        {/* OAuth */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Méthode 2: OAuth 2.0</h2>
          
          <p className="text-gray-300 mb-4">Pour authentifier vos utilisateurs finaux:</p>
          
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {oauthExample}
            </pre>
            <button
              onClick={() => copyCode(oauthExample, 'oauth')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'oauth' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </Card>

        {/* JWT */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">JWT Tokens</h2>
          
          <p className="text-gray-300 mb-4">Vérification côté serveur:</p>
          
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {jwtExample}
            </pre>
            <button
              onClick={() => copyCode(jwtExample, 'jwt')}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600"
            >
              {copied === 'jwt' ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </Card>

        {/* Rate Limiting */}
        <Card className="p-6 bg-yellow-900/20 border-yellow-500/30 mb-8">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">Rate Limiting</h3>
              <ul className="space-y-1 text-gray-300 text-sm">
                <li>• Plan Free: 100 req/min</li>
                <li>• Plan Pro: 1,000 req/min</li>
                <li>• Plan Business: 10,000 req/min</li>
                <li>• Plan Enterprise: Illimité</li>
              </ul>
              <Link href="/help/documentation/api/rate-limiting" className="text-blue-400 hover:text-blue-300 text-sm mt-2 inline-block">
                En savoir plus →
              </Link>
            </div>
          </div>
        </Card>

        {/* Security Best Practices */}
        <Card className="p-6 bg-gray-800/50 border-gray-700">
          <h2 className="text-2xl font-bold text-white mb-4">Bonnes Pratiques</h2>
          <div className="space-y-3 text-gray-300">
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Stockez vos clés dans variables d'environnement</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Ne commitez jamais vos clés dans Git</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Utilisez HTTPS uniquement</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Regénérez vos clés si compromises</div>
            <div className="flex gap-2"><CheckCircle className="w-5 h-5 text-green-400" /> Utilisez différentes clés dev/prod</div>
          </div>
        </Card>
      </div>
    </div>
  );
}

const APIAuthenticationPageMemo = memo(APIAuthenticationPageContent);

export default function APIAuthenticationPage() {
  return (
    <ErrorBoundary componentName="APIAuthenticationPage">
      <APIAuthenticationPageMemo />
    </ErrorBoundary>
  );
}
