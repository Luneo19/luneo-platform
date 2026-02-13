'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Cpu,
  HardDrive,
  Users,
  Globe,
  Camera,
  Package,
  Loader2,
  ArrowLeft,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  Minus,
  Plus,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { logger } from '@/lib/logger';
import Link from 'next/link';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { cn } from '@/lib/utils';

interface AddOnConfig {
  id: string;
  name: string;
  description: string;
  unit: string;
  basePriceCents: number;
  bulkDiscounts: { minQuantity: number; discountPercent: number }[];
  availableForPlans: string[];
}

const ADDON_ICONS: Record<string, React.ReactNode> = {
  ai_credits: <Cpu className="w-5 h-5 text-blue-400" />,
  ar_sessions: <Camera className="w-5 h-5 text-purple-400" />,
  storage_gb: <HardDrive className="w-5 h-5 text-cyan-400" />,
  api_calls: <Globe className="w-5 h-5 text-indigo-400" />,
  team_members: <Users className="w-5 h-5 text-pink-400" />,
};

const ADDON_UNITS: Record<string, string> = {
  credits: 'credit',
  sessions: 'session',
  gb: 'Go',
  calls: '1K appels',
  members: 'membre',
};

function calculatePrice(addon: AddOnConfig, quantity: number): { unitPrice: number; totalPrice: number; discount: number } {
  let discount = 0;
  for (const bd of addon.bulkDiscounts) {
    if (quantity >= bd.minQuantity) {
      discount = bd.discountPercent;
    }
  }
  const unitPrice = Math.round(addon.basePriceCents * (1 - discount / 100));
  const totalPrice = unitPrice * quantity;
  return { unitPrice, totalPrice, discount };
}

function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',') + '\u20ac';
}

interface AddonCardProps {
  addon: AddOnConfig;
  quantity: number;
  onQuantityChange: (qty: number) => void;
}

function AddonCard({ addon, quantity, onQuantityChange }: AddonCardProps) {
  const { unitPrice, totalPrice, discount } = calculatePrice(addon, quantity);
  const unitLabel = ADDON_UNITS[addon.unit] || addon.unit;

  return (
    <Card className="bg-dark-card border-white/[0.06] hover:border-white/[0.12] transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {ADDON_ICONS[addon.id] || <Package className="w-5 h-5 text-gray-400" />}
            <div>
              <CardTitle className="text-base text-white">{addon.name}</CardTitle>
              <CardDescription className="text-xs text-gray-500 mt-0.5">{addon.description}</CardDescription>
            </div>
          </div>
          {discount > 0 && (
            <Badge className="bg-emerald-900/30 border-emerald-500/30 text-emerald-300 text-xs">
              -{discount}%
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Prix unitaire</span>
          <span className="text-white font-medium">{formatCents(unitPrice)} / {unitLabel}</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 bg-white/[0.02] border-white/[0.08]"
            onClick={() => onQuantityChange(Math.max(0, quantity - (addon.id === 'ai_credits' ? 100 : addon.id === 'api_calls' ? 1000 : addon.id === 'ar_sessions' ? 100 : 1)))}
            disabled={quantity <= 0}
          >
            <Minus className="w-3 h-3" />
          </Button>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => onQuantityChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="text-center h-8 bg-white/[0.02] border-white/[0.08] text-white [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            min={0}
          />
          <Button
            variant="outline"
            size="sm"
            className="w-8 h-8 p-0 bg-white/[0.02] border-white/[0.08]"
            onClick={() => onQuantityChange(quantity + (addon.id === 'ai_credits' ? 100 : addon.id === 'api_calls' ? 1000 : addon.id === 'ar_sessions' ? 100 : 1))}
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {quantity > 0 && (
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
            <span className="text-sm text-gray-400">Sous-total</span>
            <span className="text-sm text-white font-semibold">{formatCents(totalPrice)}</span>
          </div>
        )}

        {addon.bulkDiscounts.length > 0 && (
          <div className="text-xs text-gray-600">
            Remises volume: {addon.bulkDiscounts.map((bd) => `${bd.minQuantity}+ = -${bd.discountPercent}%`).join(' | ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddonsPageContent() {
  const [loading, setLoading] = useState(true);
  const [addons, setAddons] = useState<AddOnConfig[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [currentPlan, setCurrentPlan] = useState<string>('free');
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // Load subscription to get current plan
        const subRes = await api.get<{ plan?: string }>('/api/v1/billing/subscription');
        const sub = ((subRes as { data?: { plan?: string } })?.data ?? subRes) as { plan?: string };
        const plan = sub?.plan || 'free';
        setCurrentPlan(plan);

        // Load available add-ons for the plan
        const addonsRes = await api.get<{ addOns?: AddOnConfig[] }>(`/api/v1/pricing/plans/${plan}/addons`);
        const result = ((addonsRes as { data?: { addOns?: AddOnConfig[] } })?.data ?? addonsRes) as { addOns?: AddOnConfig[] } | AddOnConfig[];
        
        if (Array.isArray(result)) {
          setAddons(result);
        } else if (result?.addOns && Array.isArray(result.addOns)) {
          setAddons(result.addOns);
        } else {
          // Fallback: fetch all add-ons
          setAddons([]);
        }
      } catch (err) {
        logger.error('Failed to load add-ons', { error: err });
        setError('Impossible de charger les add-ons disponibles');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalCents = useMemo(() => {
    return addons.reduce((sum, addon) => {
      const qty = quantities[addon.id] || 0;
      if (qty <= 0) return sum;
      return sum + calculatePrice(addon, qty).totalPrice;
    }, 0);
  }, [addons, quantities]);

  const selectedCount = useMemo(() => {
    return Object.values(quantities).filter((q) => q > 0).length;
  }, [quantities]);

  const handlePurchase = async () => {
    if (totalCents <= 0) return;

    setPurchasing(true);
    setError(null);

    try {
      const selectedAddons = addons
        .filter((a) => (quantities[a.id] || 0) > 0)
        .map((a) => ({ addOnId: a.id, quantity: quantities[a.id] }));

      await api.post('/api/v1/billing/purchase-addons', { addons: selectedAddons });
      setPurchaseSuccess(true);
      setQuantities({});
      logger.info('Add-ons purchased successfully', { addons: selectedAddons });
    } catch (err) {
      logger.error('Failed to purchase add-ons', { error: err });
      setError('Erreur lors de l\'achat. Veuillez reessayer.');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Link href="/billing">
          <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Retour
          </Button>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-white">Add-ons</h1>
        <p className="text-gray-400 text-sm mt-1">
          Achetez des ressources supplementaires pour votre plan{' '}
          <Badge variant="outline" className="bg-purple-900/30 border-purple-500/30 text-purple-300">
            {currentPlan}
          </Badge>
        </p>
      </div>

      {error && (
        <Alert className="border-red-500/20 bg-red-900/10">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <AlertDescription className="text-red-300">{error}</AlertDescription>
        </Alert>
      )}

      {purchaseSuccess && (
        <Alert className="border-emerald-500/20 bg-emerald-900/10">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <AlertDescription className="text-emerald-300">
            Add-ons achetes avec succes ! Vos limites ont ete mises a jour.
          </AlertDescription>
        </Alert>
      )}

      {addons.length === 0 ? (
        <Card className="bg-dark-card border-white/[0.06]">
          <CardContent className="p-8 text-center">
            <Package className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">Aucun add-on disponible pour votre plan actuel.</p>
            <Link href="/plans">
              <Button className="mt-4 bg-purple-600 hover:bg-purple-700">
                Upgrader votre plan
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addons.map((addon) => (
              <AddonCard
                key={addon.id}
                addon={addon}
                quantity={quantities[addon.id] || 0}
                onQuantityChange={(qty) =>
                  setQuantities((prev) => ({ ...prev, [addon.id]: qty }))
                }
              />
            ))}
          </div>

          {/* Cart summary */}
          {totalCents > 0 && (
            <Card className="bg-dark-card border-purple-500/20 sticky bottom-4">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="w-5 h-5 text-purple-400" />
                  <div>
                    <p className="text-sm text-white font-medium">
                      {selectedCount} add-on{selectedCount > 1 ? 's' : ''} selectionne{selectedCount > 1 ? 's' : ''}
                    </p>
                    <p className="text-xs text-gray-500">Total: {formatCents(totalCents)}</p>
                  </div>
                </div>
                <Button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {purchasing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Achat en cours...
                    </>
                  ) : (
                    <>
                      Acheter - {formatCents(totalCents)}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default function AddonsPage() {
  return (
    <ErrorBoundary componentName="AddonsPage">
      <AddonsPageContent />
    </ErrorBoundary>
  );
}
