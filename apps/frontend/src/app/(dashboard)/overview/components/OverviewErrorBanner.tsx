'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function OverviewErrorBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <div className="dash-card rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-amber-300 font-medium">Données partiellement disponibles</p>
            <p className="text-xs text-amber-400/80 mt-0.5">{error}</p>
          </div>
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="border-amber-500/50 hover:bg-amber-500/10 text-amber-300"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Réessayer
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
