'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export function OverviewErrorBanner({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
      <Card className="p-4 bg-yellow-950/20 border-yellow-500/30">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm text-yellow-300 font-medium">Données partiellement disponibles</p>
            <p className="text-xs text-yellow-400/80 mt-0.5">{error}</p>
          </div>
          <Button
            onClick={onRetry}
            size="sm"
            variant="outline"
            className="border-yellow-500/50 hover:bg-yellow-500/10"
          >
            <RefreshCw className="w-4 h-4 mr-1" />
            Réessayer
          </Button>
        </div>
      </Card>
    </motion.div>
  );
}
