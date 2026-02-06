/**
 * Loading State pour les pages publiques
 * FE-02: Loading states pour routes critiques
 */

import { Loader2 } from 'lucide-react';

export default function PublicLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Chargement de la page...</p>
      </div>
    </div>
  );
}
