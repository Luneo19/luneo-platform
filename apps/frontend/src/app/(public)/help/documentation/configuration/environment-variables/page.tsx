'use client';

import React, { memo, useCallback, useMemo } from 'react';
import { LazyMotionDiv as Motion } from '@/lib/performance/dynamic-motion';
import { Key, Copy, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function EnvironmentVariablesPageContent() {
  const [copied, setCopied] = React.useState(false);
  const copyCode = useCallback(() => {
    navigator.clipboard.writeText(envExample);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const envExample = useMemo(() => `# ============================================
# FRONTEND ENVIRONMENT VARIABLES
# ============================================

# Backend API (NestJS)
NEXT_PUBLIC_API_URL=https://api.luneo.app

# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx

# Stripe Price IDs
STRIPE_PRICE_PRO=price_xxxxxxxxxxxxx
STRIPE_PRICE_BUSINESS=price_xxxxxxxxxxxxx
STRIPE_PRICE_ENTERPRISE=price_xxxxxxxxxxxxx

# Google OAuth
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Application URLs
NEXT_PUBLIC_APP_URL=https://luneo.app
NEXT_PUBLIC_API_URL=https://api.luneo.app

# OpenAI (for AI features)
OPENAI_API_KEY=sk-xxxxxxxxxxxxx

# SendGrid (for emails)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@luneo.app

# Vercel Analytics (optional)
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your_analytics_id`, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center space-x-2 text-sm text-gray-400 mb-8">
          <Link href="/help/documentation" className="hover:text-white">Documentation</Link>
          <span>/</span>
          <Link href="/help/documentation/configuration" className="hover:text-white">Configuration</Link>
          <span>/</span>
          <span className="text-white">Variables d'environnement</span>
        </div>

        {/* Header */}
        <Motion initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center px-3 py-1 bg-green-500/20 border border-green-400/30 rounded-full text-green-300 text-sm mb-4">
            <Key className="w-4 h-4 mr-2" />
            Configuration
          </div>
          <h1 className="text-4xl font-bold mb-4">Variables d'environnement</h1>
          <p className="text-xl text-gray-300 mb-8">
            Configuration complète des variables d'environnement pour Luneo en développement et production.
          </p>
        </Motion>

        {/* Frontend Variables */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Variables Frontend (Next.js)</h2>
          <Card className="bg-gray-800/50 border-gray-700 p-6 mb-6">
            <p className="text-gray-300 mb-4">
              Créez un fichier <code className="bg-gray-700 px-2 py-1 rounded">.env.local</code> à la racine de <code className="bg-gray-700 px-2 py-1 rounded">apps/frontend/</code>
            </p>
            <div className="bg-gray-900 rounded-lg p-4 relative group">
              <button
                onClick={copyCode}
                className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                {copied ? (
                  <CheckCircle className="w-5 h-5 text-green-400" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-400 hover:text-white" />
                )}
              </button>
              <pre className="text-sm text-gray-300 overflow-x-auto">
                <code>{envExample}</code>
              </pre>
            </div>
          </Card>

          {/* Variable Details */}
          <div className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-3 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-blue-400" />
                NEXT_PUBLIC_API_URL
              </h3>
              <p className="text-gray-300 mb-2">
                <strong>Obligatoire:</strong> Oui<br />
                <strong>Type:</strong> URL publique<br />
                <strong>Description:</strong> URL de l&apos;API backend NestJS (ex: https://api.luneo.app)
              </p>
              <p className="text-sm text-gray-400">
                En local : <code className="bg-gray-700 px-1">http://localhost:3001</code>. En production : l&apos;URL de votre API déployée.
              </p>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-3">NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY</h3>
              <p className="text-gray-300 mb-2">
                <strong>Obligatoire:</strong> Oui (si Stripe activé)<br />
                <strong>Type:</strong> Clé publique<br />
                <strong>Description:</strong> Clé publique Stripe pour le frontend
              </p>
              <p className="text-sm text-gray-400">
                Trouvez cette valeur dans : Stripe Dashboard → Developers → API keys → Publishable key
              </p>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="text-xl font-bold mb-3">STRIPE_SECRET_KEY</h3>
              <p className="text-gray-300 mb-2">
                <strong>Obligatoire:</strong> Oui (si Stripe activé)<br />
                <strong>Type:</strong> Clé secrète<br />
                <strong>Description:</strong> Clé secrète Stripe (backend only)
              </p>
              <div className="mt-2 p-3 bg-red-900/20 border border-red-500/30 rounded">
                <p className="text-sm text-red-300">
                  <strong>⚠️ Production:</strong> Utilisez <code className="bg-gray-700 px-1">sk_live_</code> pas <code className="bg-gray-700 px-1">sk_test_</code>
                </p>
              </div>
            </Card>
          </div>
        </div>

        {/* Production Setup */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Configuration Production (Vercel)</h2>
          <Card className="bg-blue-900/20 border-blue-500/30 p-6 mb-6">
            <h3 className="text-xl font-bold mb-4">Étapes de configuration</h3>
            <ol className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="font-bold text-blue-400 mr-3">1.</span>
                <span>Allez sur <strong>Vercel Dashboard</strong> → Votre projet → Settings → Environment Variables</span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-400 mr-3">2.</span>
                <span>Cliquez sur <strong>"Add New"</strong></span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-400 mr-3">3.</span>
                <span>Pour chaque variable, sélectionnez l'environnement : <strong>Production</strong></span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-400 mr-3">4.</span>
                <span>Collez la valeur et cliquez <strong>"Save"</strong></span>
              </li>
              <li className="flex items-start">
                <span className="font-bold text-blue-400 mr-3">5.</span>
                <span>Redéployez votre application pour appliquer les changements</span>
              </li>
            </ol>
          </Card>
        </div>

        {/* Security Best Practices */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Sécurité et bonnes pratiques</h2>
          <div className="space-y-4">
            <Card className="bg-green-900/20 border-green-500/30 p-6">
              <div className="flex items-start">
                <CheckCircle className="w-6 h-6 text-green-400 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold mb-2">✅ À FAIRE</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Utilisez des clés différentes pour dev et production</li>
                    <li>• Ne commitez JAMAIS les fichiers .env dans Git</li>
                    <li>• Ajoutez .env* dans votre .gitignore</li>
                    <li>• Rotez vos clés API régulièrement (tous les 3 mois minimum)</li>
                    <li>• Utilisez des secrets managers pour la production (Vercel, AWS Secrets Manager)</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card className="bg-red-900/20 border-red-500/30 p-6">
              <div className="flex items-start">
                <AlertCircle className="w-6 h-6 text-red-400 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-bold mb-2">❌ À NE JAMAIS FAIRE</h3>
                  <ul className="space-y-2 text-gray-300 text-sm">
                    <li>• Ne partagez jamais vos clés secrètes publiquement</li>
                    <li>• Ne hardcodez pas les clés dans le code</li>
                    <li>• N'exposez pas les clés backend (service_role, secret_key) côté client</li>
                    <li>• N'utilisez pas les mêmes clés en dev et prod</li>
                    <li>• Ne commitez pas les .env dans GitHub</li>
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Problèmes courants</h2>
          <div className="space-y-4">
            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="font-bold text-lg mb-2">❌"Environment variable not defined"</h3>
              <p className="text-gray-300 mb-2"><strong>Cause:</strong> Variable manquante ou mal nommée</p>
              <p className="text-gray-300"><strong>Solution:</strong></p>
              <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1 mt-2">
                <li>Vérifiez l'orthographe exacte dans .env.local</li>
                <li>Redémarrez le serveur dev : <code className="bg-gray-700 px-2 py-1 rounded">npm run dev</code></li>
                <li>Les variables NEXT_PUBLIC_ sont accessibles côté client</li>
              </ol>
            </Card>

            <Card className="bg-gray-800/50 border-gray-700 p-6">
              <h3 className="font-bold text-lg mb-2">❌ &quot;API unreachable&quot; ou erreurs réseau</h3>
              <p className="text-gray-300 mb-2"><strong>Solution:</strong></p>
              <ol className="list-decimal list-inside text-sm text-gray-400 space-y-1">
                <li>Vérifiez que NEXT_PUBLIC_API_URL pointe vers votre backend (ex: https://api.luneo.app)</li>
                <li>En local, assurez-vous que le backend NestJS tourne sur le port configuré (ex: 3001)</li>
                <li>Vérifiez CORS et que le backend autorise l&apos;origine du frontend</li>
              </ol>
            </Card>
          </div>
        </div>

        {/* Next Steps */}
        <div className="border-t border-gray-700 pt-8">
          <h2 className="text-2xl font-bold mb-6">Prochaines étapes</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Link href="/help/documentation/configuration/setup">
              <Card className="bg-gray-800/50 border-gray-700 p-6 hover:border-green-500/50 transition-all group">
                <h3 className="font-bold text-lg mb-2 group-hover:text-green-400">Configuration initiale →</h3>
                <p className="text-gray-400 text-sm">Guide de configuration complète</p>
              </Card>
            </Link>
            <Link href="/help/documentation/quickstart/deploy">
              <Card className="bg-gray-800/50 border-gray-700 p-6 hover:border-green-500/50 transition-all group">
                <h3 className="font-bold text-lg mb-2 group-hover:text-green-400">Déploiement →</h3>
                <p className="text-gray-400 text-sm">Déployez en production</p>
              </Card>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const EnvironmentVariablesPageMemo = memo(EnvironmentVariablesPageContent);

export default function EnvironmentVariablesPage() {
  return (
    <ErrorBoundary componentName="EnvironmentVariablesPage">
      <EnvironmentVariablesPageMemo />
    </ErrorBoundary>
  );
}
