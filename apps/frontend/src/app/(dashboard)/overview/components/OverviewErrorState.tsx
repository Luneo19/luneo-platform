'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function OverviewErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  const router = useRouter();
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="p-8 max-w-md bg-red-50 border-red-200 text-center">
        <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Erreur de chargement</h3>
        <p className="text-sm text-gray-600 mb-6">{error}</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={onRetry} className="bg-red-600 hover:bg-red-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
          <Button
            onClick={() => router.push('/dashboard/ai-studio')}
            variant="outline"
            className="border-gray-300 hover:bg-gray-100"
          >
            Continuer quand même
          </Button>
        </div>
      </Card>
    </div>
  );
}
