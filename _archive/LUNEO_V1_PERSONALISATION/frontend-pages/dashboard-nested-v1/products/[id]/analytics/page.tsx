'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, Eye, ShoppingCart, DollarSign, TrendingUp, ArrowRight } from 'lucide-react';

export default function ProductAnalyticsPage() {
  const params = useParams();
  const productId = params.id as string;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Vues" value="—" change={null} icon={Eye} />
        <KPICard title="Personnalisations" value="—" change={null} icon={BarChart3} />
        <KPICard title="Commandes" value="—" change={null} icon={ShoppingCart} />
        <KPICard title="Revenus" value="—" change={null} icon={DollarSign} />
      </div>

      {/* Placeholder for charts */}
      <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
        <CardHeader>
          <CardTitle className="text-white">Performance du produit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-white/40" />
            </div>
            <p className="text-sm text-white/50 mb-4">
              Les analytics de ce produit apparaîtront ici une fois que vous aurez des vues et des commandes.
            </p>
            <Button asChild variant="outline" size="sm" className="border-white/[0.08] text-white/70 hover:bg-white/[0.04]">
              <Link href="/dashboard/analytics">
                Analytics globales
                <ArrowRight className="w-3 h-3 ml-2" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KPICard({
  title,
  value,
  change,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string | null;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="dash-card border-white/[0.06] bg-white/[0.03]">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <Icon className="w-4 h-4 text-white/40" />
          {change && (
            <span className="text-xs text-green-400">{change}</span>
          )}
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-white/50 mt-1">{title}</p>
      </CardContent>
    </Card>
  );
}
