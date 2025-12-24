'use client';

import React, { memo } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import Link from 'next/link';

function OfflinePageContent() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="w-24 h-24 mx-auto mb-6 bg-gray-800 rounded-full flex items-center justify-center">
            <WifiOff className="w-12 h-12 text-gray-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">
            Vous êtes hors ligne
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            Impossible de se connecter à Internet. Vérifiez votre connexion et réessayez.
          </p>
        </div>

        <div className="space-y-4">
          <Button
            onClick={handleRetry}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Réessayer
          </Button>
          <Link href="/">
            <Button
              variant="outline"
              className="w-full border-gray-700 text-gray-300 hover:bg-gray-800"
              size="lg"
            >
              Retour à l'accueil
            </Button>
          </Link>
        </div>

        <div className="mt-12 text-sm text-gray-500">
          <p>Conseil: Activez le mode hors ligne dans les paramètres de votre navigateur pour accéder au contenu mis en cache.</p>
        </div>
      </div>
    </div>
  );
}

const OfflinePageMemo = memo(OfflinePageContent);

export default function OfflinePage() {
  return (
    <ErrorBoundary componentName="OfflinePage">
      <OfflinePageMemo />
    </ErrorBoundary>
  );
}
