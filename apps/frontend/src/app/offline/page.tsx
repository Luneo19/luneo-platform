/**
 * Offline Page
 * Page affichée quand l'utilisateur est hors ligne
 */

import { WifiOff, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-6 p-6 bg-amber-500/20 rounded-full w-fit">
          <WifiOff className="w-16 h-16 text-amber-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Vous êtes hors ligne
        </h1>
        
        <p className="text-slate-400 mb-8">
          Vérifiez votre connexion internet et réessayez. Certaines fonctionnalités 
          peuvent être disponibles en mode hors ligne.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-5 h-5 mr-2" />
            Réessayer
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
          >
            <Home className="w-5 h-5 mr-2" />
            Accueil
          </Link>
        </div>
        
        <p className="mt-8 text-sm text-slate-500">
          Les designs et données récentes sont disponibles hors ligne.
        </p>
      </div>
    </div>
  );
}


