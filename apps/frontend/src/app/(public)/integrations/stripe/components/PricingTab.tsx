'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function PricingTab() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h3 className="text-4xl font-bold text-gray-900 mb-4">Tarifs Stripe</h3>
        <p className="text-xl text-gray-600">Payez uniquement sur les transactions</p>
      </div>
      <Card className="p-8 md:p-10">
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Frais par transaction</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Cartes UE: 1,5% + 0,25€</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Cartes hors UE: 2,5% + 0,25€</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Pas de frais mensuels</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Inclus</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Dashboard Stripe</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Rapports et analytics</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Support 24/7</span></li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
