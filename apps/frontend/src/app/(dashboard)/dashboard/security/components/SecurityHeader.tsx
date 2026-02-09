/**
 * Header de la page Security
 */

'use client';

import { Shield } from 'lucide-react';

export function SecurityHeader() {
  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
        <Shield className="w-8 h-8 text-cyan-400" />
        Sécurité
      </h1>
      <p className="text-white/60 mt-1">
        Gérez la sécurité de votre compte et vos paramètres d'authentification
      </p>
    </div>
  );
}



