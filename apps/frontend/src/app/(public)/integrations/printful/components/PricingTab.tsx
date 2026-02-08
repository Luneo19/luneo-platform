'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function PricingTab() {
  return (
    <div className="space-y-8">
      <div className="text-center mb-12">
        <h3 className="text-4xl font-bold text-gray-900 mb-4">Tarifs Printful</h3>
        <p className="text-xl text-gray-600">Payez uniquement ce que vous vendez</p>
      </div>
      <Card className="p-8 md:p-10">
        <div className="grid md:grid-cols-3 gap-8">
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Coût de production</h4>
            <p className="text-gray-600 mb-4">Prix de gros compétitifs</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>T-shirt: à partir de 8€</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Hoodie: à partir de 25€</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Mug: à partir de 6€</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Frais d&apos;expédition</h4>
            <p className="text-gray-600 mb-4">Selon destination et produit</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>France: 3-5€</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Europe: 5-8€</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>International: 8-15€</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900 mb-4">Aucun frais caché</h4>
            <p className="text-gray-600 mb-4">Transparence totale</p>
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Aucun frais d&apos;installation</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Aucun frais mensuel</span></li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /><span>Aucun minimum de commande</span></li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
