/**
 * Loading State pour l'Onboarding
 */

import { Loader2, Sparkles } from 'lucide-react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <Sparkles className="absolute -top-1 -right-1 h-4 w-4 text-yellow-400" />
        </div>
        <p className="text-muted-foreground">Préparation de votre espace...</p>
      </div>
    </div>
  );
}
