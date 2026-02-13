'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Plus, CheckCircle } from 'lucide-react';
import { useI18n } from '@/i18n/useI18n';
import { cn } from '@/lib/utils';
import { formatNumber, formatPrice } from '@/lib/utils/formatters';
import type { CreditPack } from './types';

interface CreditsPacksTabProps {
  creditPacks: CreditPack[];
  onPurchase: (packId: string) => void;
}

export function CreditsPacksTab({ creditPacks, onPurchase }: CreditsPacksTabProps) {
  const { t } = useI18n();
  return (
    <Card className="bg-white border-gray-200">
      <CardHeader>
        <CardTitle className="text-gray-900">{t('credits.packsTitle')}</CardTitle>
        <CardDescription className="text-gray-600">{t('credits.packsDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {creditPacks.map((pack, index) => (
            <motion
              key={pack.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  'relative p-6 bg-gray-50 border-gray-200 transition-all hover:border-cyan-500/50',
                  pack.isFeatured && 'border-cyan-500/50 bg-cyan-50/50',
                )}
              >
                {pack.isFeatured && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-cyan-500">
                    {pack.badge || t('credits.popular')}
                  </Badge>
                )}
                {pack.savings && (
                  <Badge className="absolute top-2 right-2 bg-green-500">-{pack.savings}%</Badge>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{pack.name}</h3>
                  <div className="mb-4">
                    <p className="text-4xl font-bold text-cyan-600">{formatNumber(pack.credits)}</p>
                    <p className="text-sm text-gray-600">{t('credits.creditsLabel')}</p>
                  </div>
                  <div className="mb-4">
                    <p className="text-3xl font-bold text-gray-900">{formatPrice(pack.price)}</p>
                    <p className="text-sm text-gray-600">{formatPrice(pack.price / pack.credits)} {t('credits.perCredit')}</p>
                  </div>
                  {pack.features && (
                    <div className="mb-4 space-y-2">
                      {pack.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center justify-center gap-2 text-sm text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {feature}
                        </div>
                      ))}
                    </div>
                  )}
                  <Button
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500"
                    onClick={() => onPurchase(pack.id)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('credits.buyNow')}
                  </Button>
                </div>
              </Card>
            </motion>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
