'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { endpoints } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, QrCode, Smartphone, MousePointer, ShoppingCart, CreditCard } from 'lucide-react';

const STAGES = [
  { key: 'qrScans', label: 'Scans QR', icon: QrCode },
  { key: 'arLaunches', label: 'Lancements AR', icon: Smartphone },
  { key: 'placements', label: 'Placements', icon: MousePointer },
  { key: 'cart', label: 'Panier', icon: ShoppingCart },
  { key: 'purchase', label: 'Achat', icon: CreditCard },
] as const;

export function ConversionsPageClient() {
  const [data, setData] = useState<{
    funnel?: { stage: string; count: number; rate?: number }[];
    rates?: Record<string, number>;
    revenue?: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    endpoints.ar.analytics.conversions()
      .then((res) => setData((res as typeof data) ?? null))
      .catch((err) => setError(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Skeleton className="h-80 rounded-xl w-full" />;
  }
  if (error) {
    return (
      <Card className="border-red-500/30 bg-red-500/10 p-6">
        <p className="text-red-400">{error.message}</p>
      </Card>
    );
  }

  const funnel = data?.funnel ?? [];
  const rates = data?.rates ?? {};
  const revenue = data?.revenue ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Conversions AR</h1>
        <p className="text-sm text-white/60">Entonnoir QR → AR → Panier → Achat</p>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Revenus attribués
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold text-white">{revenue.toFixed(2)} €</p>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-white/5">
        <CardHeader>
          <CardTitle className="text-white">Entonnoir de conversion</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {STAGES.map((stage, i) => {
            const Icon = stage.icon;
            const item = funnel.find((f) => f.stage === stage.key);
            const count = item?.count ?? 0;
            const rate = rates[stage.key] ?? item?.rate;
            return (
              <div key={stage.key} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-40">
                  <Icon className="h-4 w-4 text-white/60" />
                  <span className="text-white/80">{stage.label}</span>
                </div>
                <div className="flex-1 flex items-center gap-4">
                  <div className="flex-1 h-8 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500/80 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (count / Math.max(1, funnel[0]?.count ?? 1)) * 100)}%` }}
                    />
                  </div>
                  <span className="text-white font-medium w-16">{count}</span>
                  {rate != null && (
                    <span className="text-white/60 text-sm w-12">{(rate * 100).toFixed(1)}%</span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
