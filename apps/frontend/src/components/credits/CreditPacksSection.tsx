'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { logger } from '@/lib/logger';
import { endpoints } from '@/lib/api/client';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Check, Gift, Loader2, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface Pack {
  id: string;
  name: string;
  credits: number;
  price: number;
  priceCents: number;
  stripePriceId?: string;
  badge?: string;
  savings?: number;
  isFeatured?: boolean;
}

interface CreditPacksSectionProps {
  className?: string;
}

export function CreditPacksSection({ className }: CreditPacksSectionProps) {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchPacks();
  }, []);

  const fetchPacks = async () => {
    try {
      setLoading(true);
      const data = await endpoints.credits.packs();
      setPacks(Array.isArray(data) ? data : ((data as { packs?: Pack[] }).packs || []));
    } catch (error) {
      logger.error('Failed to fetch packs', error instanceof Error ? error : new Error(String(error)), {
        component: 'CreditPacksSection',
      });
      // Fallback packs
      setPacks([
        { id: 'pack_100', name: 'Pack 100', credits: 100, price: 19, priceCents: 1900, savings: 0, isFeatured: false },
        { id: 'pack_500', name: 'Pack 500', credits: 500, price: 79, priceCents: 7900, badge: 'Best Value', savings: 16, isFeatured: true },
        { id: 'pack_1000', name: 'Pack 1000', credits: 1000, price: 139, priceCents: 13900, savings: 26, isFeatured: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (pack: Pack) => {
    if (!pack.stripePriceId && !pack.id) {
      toast({
        title: 'Erreur',
        description: 'Pack non configuré. Veuillez contacter le support.',
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
        throw new Error('URL de paiement non reçue');
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Échec de l\'achat. Veuillez réessayer.';
      logger.error('Purchase failed', error instanceof Error ? error : new Error(String(error)), {
        component: 'CreditPacksSection',
        packId: pack.id,
      });
      toast({
        title: 'Erreur',
        description: message,
        variant: 'destructive',
      });
      setPurchasing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <section className={`py-16 sm:py-20 bg-gradient-to-br from-gray-900 via-purple-950/20 to-blue-950/20 ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-400">Crédits IA à la carte</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Rechargez vos{' '}
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              crédits IA
            </span>
          </h2>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Besoin de plus de crédits ? Achetez des packs supplémentaires à tout moment.
            <br />
            <span className="text-purple-400 font-semibold">Parfait pour compléter votre abonnement.</span>
          </p>
        </motion>

        {/* Packs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {packs.map((pack, index) => (
            <motion
              key={pack.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Featured Badge */}
              {pack.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <span className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-purple-500 to-pink-600 text-white text-xs font-bold rounded-full shadow-lg shadow-purple-500/30">
                    <Gift className="w-4 h-4 mr-1.5" />
                    {pack.badge}
                  </span>
                </div>
              )}

              <Card className={`h-full flex flex-col bg-gray-800/50 backdrop-blur-sm p-6 sm:p-8 transition-all duration-300 ${
                pack.isFeatured 
                  ? 'border-2 border-purple-500/50 shadow-2xl shadow-purple-500/20 scale-[1.02]' 
                  : 'border-gray-700/50 hover:border-gray-600'
              }`}>
                {/* Credits Amount */}
                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 text-white mb-4 shadow-lg">
                    <Zap className="w-8 h-8" />
                  </div>
                  <h3 className="text-3xl sm:text-4xl font-bold text-white mb-2">{pack.credits}</h3>
                  <p className="text-sm text-gray-400">Crédits IA</p>
                </div>

                {/* Price */}
                <div className="text-center mb-6">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl sm:text-5xl font-bold text-white">
                      {pack.price}€
                    </span>
                  </div>
                  {pack.savings && pack.savings > 0 && (
                    <p className="text-sm text-green-400 font-semibold mt-2 flex items-center justify-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Économisez {pack.savings}%
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {(pack.price / pack.credits).toFixed(3)}€ par crédit
                  </p>
                </div>

                {/* CTA Button */}
                <Button
                  onClick={() => handleBuy(pack)}
                  disabled={purchasing !== null}
                  className={`w-full h-12 font-semibold transition-all ${
                    pack.isFeatured
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white shadow-lg shadow-purple-500/25'
                      : 'bg-white/20 hover:bg-white/30 text-white border border-white/40'
                  }`}
                >
                  {purchasing === pack.id ? (
                    <div className="flex items-center">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Chargement...
                    </div>
                  ) : (
                    <>
                      Acheter maintenant
                    </>
                  )}
                </Button>

                {/* What you can do */}
                <div className="mt-6 pt-6 border-t border-gray-700/50">
                  <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold mb-3">
                    Avec ce pack
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>{Math.floor(pack.credits / 5)} générations IA</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>{Math.floor(pack.credits / 8)} rendus 3D HD</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                      <span>Crédits valables à vie</span>
                    </div>
                  </div>
                </div>
              </Card>
            </motion>
          ))}
        </div>

        {/* Trust Message */}
        <motion
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-10 text-center"
        >
          <p className="text-sm text-gray-400">
            💳 Paiement sécurisé par Stripe · 🔒 Vos crédits sont valables à vie · ⚡ Ajout instantané après paiement
          </p>
        </motion>
      </div>
    </section>
  );
}













