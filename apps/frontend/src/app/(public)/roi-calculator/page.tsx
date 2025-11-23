'use client';

import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function ROICalculatorPage() {
  const [values, setValues] = useState({ orders: 1000, avgOrder: 50, conversion: 2 });
  
  const withLuneo = {
    conversion: values.conversion * 1.35,
    revenue: values.orders * values.avgOrder * 1.35,
    increase: values.orders * values.avgOrder * 0.35
  };

  return (
    <div className="min-h-screen bg-gray-900 py-20 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Calculateur ROI</h1>
          <p className="text-xl text-gray-400">Estimez votre retour sur investissement avec Luneo</p>
        </div>

        <Card className="p-8 bg-gray-800/50 border-gray-700 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Vos Données</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Commandes mensuelles</label>
              <Input type="number" value={values.orders} onChange={(e) => setValues({...values, orders: Number(e.target.value)})} className="bg-gray-900 border-gray-600 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Panier moyen (€)</label>
              <Input type="number" value={values.avgOrder} onChange={(e) => setValues({...values, avgOrder: Number(e.target.value)})} className="bg-gray-900 border-gray-600 text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Taux conversion (%)</label>
              <Input type="number" value={values.conversion} onChange={(e) => setValues({...values, conversion: Number(e.target.value)})} className="bg-gray-900 border-gray-600 text-white" />
            </div>
          </div>
        </Card>

        <Card className="p-8 bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-400/30">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-green-400" />
            Avec Luneo
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">+35%</div>
              <div className="text-sm text-gray-400">Conversion</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">{Math.round(withLuneo.revenue).toLocaleString()}€</div>
              <div className="text-sm text-gray-400">Revenue mensuel</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-green-400 mb-2">+{Math.round(withLuneo.increase).toLocaleString()}€</div>
              <div className="text-sm text-gray-400">Augmentation</div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
