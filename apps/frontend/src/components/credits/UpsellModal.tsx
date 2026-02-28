'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Zap, Check, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/i18n/useI18n';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';

interface Pack {
  id: string;
  name: string;
  credits: number;
  price: number;
  priceCents: number;
  stripePriceId?: string;
  badge?: string;
  savings?: number;
}

interface UpsellModalProps {
  open: boolean;
  onClose: () => void;
  remainingCredits: number;
  triggerReason?: 'low_balance' | 'insufficient' | 'manual';
}

export function UpsellModal({ 
  open, 
  onClose, 
  remainingCredits,
  triggerReason = 'low_balance'
}: UpsellModalProps) {
  const { t } = useI18n();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPacks();
    }
  }, [open]);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const data = await endpoints.credits.packs();
      setPacks(Array.isArray(data) ? data : ((data as { packs?: Pack[] }).packs || []));
    } catch (error) {
      logger.error('Failed to fetch packs', error instanceof Error ? error : new Error(String(error)), {
        component: 'UpsellModal',
      });
      // Fallback packs
      setPacks([
        { id: 'pack_100', name: 'Pack 100', credits: 100, price: 19, priceCents: 1900, savings: 0 },
        { id: 'pack_500', name: 'Pack 500', credits: 500, price: 79, priceCents: 7900, badge: 'Best Value', savings: 16 },
        { id: 'pack_1000', name: 'Pack 1000', credits: 1000, price: 139, priceCents: 13900, savings: 26 },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (pack: Pack) => {
    if (!pack.stripePriceId && !pack.id) {
      toast({
        title: t('common.error'),
        description: t('creditsToast.packNotConfigured'),
        variant: 'destructive',
      });
      return;
    }

    setPurchasing(pack.id);
    try {
      const data = await endpoints.credits.buy({ packSize: pack.credits });
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error(t('creditsToast.paymentUrlNotReceived'));
      }
    } catch (error: unknown) {
      logger.error('Purchase failed', error instanceof Error ? error : new Error(String(error)), {
        component: 'UpsellModal',
        packId: pack.id,
      });
      toast({
        title: t('common.error'),
        description: getErrorDisplayMessage(error),
        variant: 'destructive',
      });
      setPurchasing(null);
    }
  };

  const getTitle = () => {
    switch (triggerReason) {
      case 'insufficient':
        return t('creditsToast.insufficientCredits');
      case 'low_balance':
        return t('creditsToast.topUpCredits');
      default:
        return t('credits.buy');
    }
  };

  const getDescription = () => {
    if (triggerReason === 'insufficient') {
      return `Il vous faut plus de crédits pour cette action. Choisissez un pack pour continuer.`;
    }
    return `Il vous reste ${remainingCredits} crédits. Choisissez un pack pour continuer à créer.`;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Zap className="w-6 h-6 text-yellow-500" />
            {getTitle()}
          </DialogTitle>
          <DialogDescription className="text-base mt-2">
            {getDescription()}
          </DialogDescription>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {packs.map((pack) => (
                <div
                  key={pack.id}
                  className={`relative border rounded-lg p-6 hover:shadow-lg transition-all ${
                    pack.badge 
                      ? 'border-primary shadow-md ring-2 ring-primary/20' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {pack.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      {pack.badge}
                    </div>
                  )}
                  
                  <div className="text-center mb-4">
                    <p className="text-3xl font-bold">{pack.credits}</p>
                    <p className="text-sm text-muted-foreground">crédits IA</p>
                  </div>
                  
                  <div className="text-center mb-4">
                    <p className="text-2xl font-bold">{pack.price}€</p>
                    {pack.savings && pack.savings > 0 && (
                      <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">
                        Économisez {pack.savings}%
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {(pack.price / pack.credits).toFixed(2)}€ par crédit
                    </p>
                  </div>
                  
                  <Button
                    className="w-full"
                    variant={pack.badge ? 'default' : 'outline'}
                    onClick={() => handleBuy(pack)}
                    disabled={purchasing !== null}
                  >
                    {purchasing === pack.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Chargement...
                      </>
                    ) : (
                      'Acheter'
                    )}
                  </Button>
                </div>
              ))}
            </div>
            
            <div className="mt-6 p-4 bg-white/[0.04] border border-white/[0.06] rounded-lg">
              <p className="text-sm font-medium text-white mb-2">✨ Que pouvez-vous faire avec vos crédits ?</p>
              <ul className="text-sm text-white/60 space-y-1">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  Génération IA (DALL-E 3) : 5 crédits
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  Rendu 3D haute résolution : 8 crédits
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  Personnalisation IA : 4 crédits
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                  Export AR : 5 crédits
                </li>
              </ul>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}












