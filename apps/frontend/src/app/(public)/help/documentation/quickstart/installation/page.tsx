'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowRight, Terminal, Package, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

function InstallationPageContent() {
  return (
    <div className="min-h-screen bg-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/help/documentation" className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1 mb-4">
            ← Documentation
          </Link>
          <h1 className="text-4xl font-bold text-white mb-4">Installation</h1>
          <p className="text-xl text-gray-400">Installez Luneo en 5 minutes</p>
        </div>

        {/* Prérequis */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-400" />
            Prérequis
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Node.js 20+</p>
                <p className="text-sm text-gray-400">Version LTS requise par la plateforme</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">npm, pnpm ou yarn</p>
                <p className="text-sm text-gray-400">Package manager au choix</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-white font-medium">Compte Luneo</p>
                <p className="text-sm text-gray-400">
                  <Link href="/register" className="text-blue-400 hover:text-blue-300">
                    Créer gratuitement
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Installation NPM */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Terminal className="w-6 h-6 text-purple-400" />
            Installation via NPM
          </h2>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-300 mb-2">1. Installer le package:</p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300">
                npm install @luneo/sdk
              </div>
            </div>

            <div>
              <p className="text-gray-300 mb-2">Ou avec pnpm:</p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300">
                pnpm add @luneo/sdk
              </div>
            </div>

            <div>
              <p className="text-gray-300 mb-2">Ou avec yarn:</p>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300">
                yarn add @luneo/sdk
              </div>
            </div>
          </div>
        </Card>

        {/* Vérification */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Vérification</h2>
          
          <p className="text-gray-300 mb-4">Créez un fichier test pour vérifier l'installation:</p>
          
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4">
            <pre className="font-mono text-sm text-gray-300 overflow-x-auto">
{`// test-luneo.js
import { LuneoClient } from '@luneo/sdk';

const client = new LuneoClient({
  apiKey: process.env.LUNEO_API_KEY
});

logger.info('✅ Luneo SDK installé!');
logger.info('Version:', client.version);`}
            </pre>
          </div>

          <p className="text-gray-300 mb-2">Exécutez:</p>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 font-mono text-sm text-gray-300">
            node test-luneo.js
          </div>
        </Card>

        {/* Dépendances */}
        <Card className="p-6 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Dépendances Recommandées</h2>
          
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">React 18+ <span className="text-gray-400 text-sm">(pour composants UI)</span></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">Next.js 14+ <span className="text-gray-400 text-sm">(recommandé)</span></p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5" />
              <div>
                <p className="text-white font-medium">TypeScript <span className="text-gray-400 text-sm">(types inclus)</span></p>
              </div>
            </div>
          </div>
        </Card>

        {/* Next Steps */}
        <Card className="p-6 bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-400/30">
          <h2 className="text-2xl font-bold text-white mb-4">Prochaines Étapes</h2>
          <div className="space-y-3">
            <Link href="/help/documentation/quickstart/configuration" className="block">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <span className="text-white font-medium">Configuration</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
            <Link href="/help/documentation/quickstart/first-customizer" className="block">
              <div className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <span className="text-white font-medium">Premier Customizer</span>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

const InstallationPageMemo = memo(InstallationPageContent);

export default function InstallationPage() {
  return (
    <ErrorBoundary componentName="InstallationPage">
      <InstallationPageMemo />
    </ErrorBoundary>
  );
}
