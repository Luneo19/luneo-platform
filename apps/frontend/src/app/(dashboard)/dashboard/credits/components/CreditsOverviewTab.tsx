'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatNumber, formatPrice, formatRelativeDate } from '@/lib/utils/formatters';
import { TRANSACTION_TYPE_CONFIG } from './constants';
import type { CreditPack, CreditTransaction } from './types';

interface CreditsOverviewTabProps {
  filteredTransactions: CreditTransaction[];
  creditPacks: CreditPack[];
  onPurchase: (packId: string) => void;
}

export function CreditsOverviewTab({
  filteredTransactions,
  creditPacks,
  onPurchase,
}: CreditsOverviewTabProps) {
  const featuredPacks = creditPacks.filter((p) => p.isFeatured).slice(0, 2);

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Utilisation récente</CardTitle>
          <CardDescription className="text-gray-600">Dernières transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredTransactions.slice(0, 5).map((transaction) => {
              const config = TRANSACTION_TYPE_CONFIG[transaction.type];
              const Icon = config.icon;
              return (
                <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg ${config.bg} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.type === 'purchase' && transaction.packName
                          ? `Achat ${transaction.packName}`
                          : transaction.type === 'usage' && transaction.source
                            ? `Utilisation: ${transaction.source}`
                            : config.label}
                      </p>
                      <p className="text-xs text-gray-600">{formatRelativeDate(transaction.createdAt)}</p>
                    </div>
                  </div>
                  <div className={cn('text-sm font-bold', transaction.amount > 0 ? 'text-green-400' : 'text-red-400')}>
                    {transaction.amount > 0 ? '+' : ''}{formatNumber(transaction.amount)}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-900">Packs recommandés</CardTitle>
          <CardDescription className="text-gray-600">Basé sur votre utilisation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {featuredPacks.map((pack) => (
              <div key={pack.id} className="p-4 bg-gray-50 rounded-lg border border-cyan-500/20">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{pack.name}</h3>
                  {pack.badge && <Badge variant="default" className="bg-cyan-500 text-xs">{pack.badge}</Badge>}
                </div>
                <p className="text-sm text-gray-600 mb-3">{pack.description}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-cyan-600">{formatNumber(pack.credits)}</p>
                    <p className="text-sm text-gray-600">crédits</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{formatPrice(pack.price)}</p>
                    {pack.savings && <p className="text-xs text-green-600">Économie de {pack.savings}%</p>}
                  </div>
                </div>
                <Button className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700" onClick={() => onPurchase(pack.id)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Acheter maintenant
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
