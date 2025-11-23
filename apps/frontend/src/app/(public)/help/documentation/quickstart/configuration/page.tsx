'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Key, Settings, CheckCircle, Copy, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ConfigurationPage() {
  const [copied, setCopied] = React.useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const envExample = `# Luneo Configuration
NEXT_PUBLIC_LUNEO_API_KEY=your_api_key_here
NEXT_PUBLIC_LUNEO_PROJECT_ID=your_project_id

# Supabase (Backend)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Stripe (Payments)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...`;

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Configuration</h1>
          <p className="text-xl text-gray-400">Configurez vos variables d'environnement</p>
        </div>

        {/* API Keys */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Key className="w-6 h-6 text-yellow-400" />
            Obtenir vos Clés API
          </h2>
          
          <ol className="space-y-4 text-gray-300">
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                1
              </span>
              <div>
                <p className="font-medium text-white">Créez un compte</p>
                <p className="text-sm text-gray-400">
                  Si ce n'est pas déjà fait:{' '}
                  <Link href="/register" className="text-blue-400 hover:text-blue-300">
                    S'inscrire gratuitement
                  </Link>
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                2
              </span>
              <div>
                <p className="font-medium text-white">Accédez aux paramètres</p>
                <p className="text-sm text-gray-400">
                  Dashboard → Settings → API Keys
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                3
              </span>
              <div>
                <p className="font-medium text-white">Générez une nouvelle clé</p>
                <p className="text-sm text-gray-400">
                  Cliquez sur "Generate API Key"
                </p>
              </div>
            </li>
          </ol>
        </Card>

        {/* Variables d'environnement */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-6 h-6 text-green-400" />
            Variables d'Environnement
          </h2>
          
          <p className="text-gray-300 mb-4">Créez un fichier <code className="px-2 py-1 bg-gray-900 rounded text-blue-400">.env.local</code>:</p>
          
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-4 overflow-x-auto text-sm text-gray-300 font-mono">
              {envExample}
            </pre>
            <button
              onClick={() => copyCode(envExample)}
              className="absolute top-3 right-3 p-2 bg-gray-800 hover:bg-gray-700 rounded-lg border border-gray-600 transition-colors"
            >
              {copied ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <Copy className="w-4 h-4 text-gray-400" />
              )}
            </button>
          </div>
        </Card>

        {/* Important */}
        <Card className="p-6 bg-yellow-900/20 border-yellow-500/30 mb-8">
          <div className="flex gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-yellow-400 mb-2">Important</h3>
              <ul className="space-y-2 text-gray-300 text-sm">
                <li>• Ne commitez JAMAIS vos clés API dans Git</li>
                <li>• Ajoutez <code className="px-1 bg-gray-900 rounded">.env.local</code> à votre <code className="px-1 bg-gray-900 rounded">.gitignore</code></li>
                <li>• Utilisez différentes clés pour dev/production</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/30">
          <h2 className="text-2xl font-bold text-white mb-4">Prochaines Étapes</h2>
          <Link href="/help/documentation/quickstart/first-customizer">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 w-full justify-between">
              <span>Créer votre premier customizer</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
