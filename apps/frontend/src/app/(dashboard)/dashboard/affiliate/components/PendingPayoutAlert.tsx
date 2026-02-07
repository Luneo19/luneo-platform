'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { formatPrice } from '@/lib/utils/formatters';
import { CreditCard, Wallet } from 'lucide-react';

interface PendingPayoutAlertProps {
  pendingCommissions: number;
  onRequestPayout: () => void;
  minThreshold: number;
}

export function PendingPayoutAlert({ pendingCommissions, onRequestPayout, minThreshold }: PendingPayoutAlertProps) {
  if (pendingCommissions < minThreshold) return null;

  return (
    <Card className="bg-gradient-to-r from-green-950/50 to-emerald-950/50 border-green-500/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Paiement disponible</h3>
              <p className="text-sm text-gray-400">
                Vous avez {formatPrice(pendingCommissions)} en commissions en attente
              </p>
            </div>
          </div>
          <Button onClick={onRequestPayout} className="bg-green-600 hover:bg-green-700">
            <CreditCard className="w-4 h-4 mr-2" />
            Demander un paiement
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
