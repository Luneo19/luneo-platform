/**
 * Header de la page Settings
 */

'use client';

import { Settings } from 'lucide-react';

export function SettingsHeader() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-cyan-400" />
          Paramètres
        </h1>
        <p className="text-gray-400 mt-1">
          Gérez vos préférences et configurations
        </p>
      </div>
    </div>
  );
}



