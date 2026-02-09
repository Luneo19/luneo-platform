'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function OverviewErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-[60vh] flex items-center justify-center dash-bg">
      <div className="dash-card rounded-2xl p-8 max-w-md border border-red-500/30 bg-red-500/5 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-white mb-2">Erreur de chargement</h3>
        <p className="text-sm text-white/60 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={onRetry}
            className="bg-red-600 hover:bg-red-500 text-white border border-red-500/30"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
          <Button
            onClick={() => router.push('/dashboard/ai-studio')}
            variant="outline"
            className="border-white/[0.06] bg-white/[0.03] hover:bg-white/[0.06] text-white"
          >
            Continuer quand même
          </Button>
        </div>
      </div>
    </div>
  );
}
