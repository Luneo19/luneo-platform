'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingDown, Shield, Zap } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';

const COMMISSION_TIERS = [
  { plan: 'Free', rate: 15, color: 'text-gray-400', badge: 'bg-gray-800' },
  { plan: 'Starter', rate: 12, color: 'text-blue-400', badge: 'bg-blue-900/50' },
  { plan: 'Professional', rate: 10, color: 'text-purple-400', badge: 'bg-purple-900/50' },
  { plan: 'Business', rate: 7, color: 'text-amber-400', badge: 'bg-amber-900/50' },
  { plan: 'Enterprise', rate: 5, color: 'text-emerald-400', badge: 'bg-emerald-900/50' },
];

function CommissionExample({ rate, saleAmount = 100, label }: { rate: number; saleAmount?: number; label: string }) {
  const net = saleAmount - (saleAmount * rate) / 100;
  return (
    <div className="text-xs text-gray-500">
      {label} <span className="text-white font-medium">{net.toFixed(0)}&euro;</span>
    </div>
  );
}

export function PricingCommissionInfo() {
  const { t } = useI18n();

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          {t('pricing.commission.title')}
        </h3>
        <p className="text-gray-400 max-w-2xl mx-auto">
          {t('pricing.commission.subtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {COMMISSION_TIERS.map((tier) => (
          <Card key={tier.plan} className="bg-dark-card border-white/[0.06] hover:border-white/[0.12] transition-colors">
            <CardContent className="p-4 text-center space-y-2">
              <Badge variant="outline" className={`${tier.badge} border-0 text-xs`}>
                {tier.plan}
              </Badge>
              <div className={`text-3xl font-bold ${tier.color}`}>
                {tier.rate}%
              </div>
              <CommissionExample
                rate={tier.rate}
                label={t('pricing.commission.onSale', { amount: 100 })}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <TrendingDown className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">{t('pricing.commission.degressive')}</p>
            <p className="text-xs text-gray-500">{t('pricing.commission.degressiveDesc')}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <Shield className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">{t('pricing.commission.minimum')}</p>
            <p className="text-xs text-gray-500">{t('pricing.commission.minimumDesc')}</p>
          </div>
        </div>
        <div className="flex items-start gap-3 p-4 rounded-lg bg-white/[0.02] border border-white/[0.04]">
          <Zap className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-white">{t('pricing.commission.allIncluded')}</p>
            <p className="text-xs text-gray-500">{t('pricing.commission.allIncludedDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
