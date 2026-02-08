/**
 * Loading State pour les pages d'aide / documentation
 */

import { Loader2 } from 'lucide-react';

export default function HelpLoading() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Chargement de l'aide...</p>
      </div>
    </div>
  );
}
