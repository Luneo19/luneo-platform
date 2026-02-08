'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertTriangle, Plus, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, formatPrice } from '@/lib/utils/formatters';
import type { CreditStats } from './types';

interface CreditsBalanceCardProps {
  stats: CreditStats;
  autoRefillEnabled: boolean;
  autoRefillThreshold: number;
  onRecharge: () => void;
}

export function CreditsBalanceCard({
  stats,
  autoRefillEnabled,
  autoRefillThreshold,
  onRecharge,
}: CreditsBalanceCardProps) {
  return (
    <Card className="bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-500/20">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 mb-2">Crédits disponibles</p>
            <div className="flex items-baseline gap-3">
              <h2 className="text-5xl font-bold text-gray-900">{formatNumber(stats.currentBalance)}</h2>
              <Badge
                className={cn(
                  'text-sm',
                  stats.currentBalance > 100 ? 'bg-green-500' : stats.currentBalance > 50 ? 'bg-yellow-500' : 'bg-red-500',
                )}
              >
                {stats.currentBalance > 100 ? 'Bon niveau' : stats.currentBalance > 50 ? 'Niveau moyen' : 'Niveau faible'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-4">
              <div>
                <p className="text-sm text-gray-600">Valeur estimée</p>
                <p className="text-xl font-bold text-cyan-600">
                  {formatPrice((stats.currentBalance / 100) * 0.1)}
                </p>
              </div>
              <Separator orientation="vertical" className="h-12 bg-gray-300" />
              <div>
                <p className="text-sm text-gray-600">Taux d'utilisation</p>
                <p className="text-xl font-bold text-purple-600">{Math.round(stats.usageRate)}%</p>
              </div>
            </div>
          </div>
          <div className="text-right">
            {stats.currentBalance < 100 && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg mb-4">
                <AlertTriangle className="w-5 h-5 text-red-400 mx-auto mb-2" />
                <p className="text-sm text-red-400 font-medium mb-1">Solde faible</p>
                <p className="text-xs text-gray-600 mb-3">Pensez à recharger vos crédits</p>
                <Button size="sm" onClick={onRecharge} className="bg-red-600 hover:bg-red-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Recharger
                </Button>
              </div>
            )}
            {autoRefillEnabled && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <p className="text-sm text-green-400 font-medium">Auto-refill activé</p>
                </div>
                <p className="text-xs text-gray-600">Recharge automatique à {autoRefillThreshold} crédits</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
