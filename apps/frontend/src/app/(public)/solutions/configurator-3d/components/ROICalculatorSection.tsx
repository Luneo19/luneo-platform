'use client';

import React, { useState, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { Calculator, TrendingUp, RotateCcw, BarChart3, Gift } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function ROICalculatorSection() {
  const [avgOrderValue, setAvgOrderValue] = useState(500);
  const [ordersPerMonth, setOrdersPerMonth] = useState(200);

  const calculations = useMemo(() => {
    const conversionIncrease = 0.35;
    const returnReduction = 0.55;
    const avgReturnCost = avgOrderValue * 0.15;
    const currentReturns = ordersPerMonth * 0.12;
    const additionalOrders = ordersPerMonth * conversionIncrease;
    const additionalRevenue = additionalOrders * avgOrderValue;
    const savedReturns = currentReturns * returnReduction;
    const savedReturnCost = savedReturns * avgReturnCost;
    const totalBenefit = additionalRevenue + savedReturnCost;
    const planCost = 79;
    const roi = ((totalBenefit - planCost) / planCost) * 100;
    return {
      additionalRevenue: Math.round(additionalRevenue),
      savedReturnCost: Math.round(savedReturnCost),
      roi: Math.round(roi),
      yearlyBenefit: Math.round(totalBenefit * 12),
    };
  }, [avgOrderValue, ordersPerMonth]);

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Calculez votre <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">ROI</span>
          </h2>
          <p className="text-gray-400">Estimez l&apos;impact du configurateur 3D sur vos ventes</p>
        </motion>
        <motion initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Card className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/20 p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Calculateur de ROI</h3>
                <p className="text-sm text-gray-400">Estimez l&apos;impact du configurateur 3D</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Panier moyen (€)</label>
                <input type="number" value={avgOrderValue} onChange={(e) => setAvgOrderValue(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Commandes/mois</label>
                <input type="number" value={ordersPerMonth} onChange={(e) => setOrdersPerMonth(Number(e.target.value))} className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white focus:border-blue-500 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <TrendingUp className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">+{calculations.additionalRevenue.toLocaleString('fr-FR')}€</div>
                <div className="text-xs text-gray-400">revenu additionnel</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <RotateCcw className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">+{calculations.savedReturnCost.toLocaleString('fr-FR')}€</div>
                <div className="text-xs text-gray-400">retours évités</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <BarChart3 className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-white">{calculations.roi.toLocaleString('fr-FR')}%</div>
                <div className="text-xs text-gray-400">ROI mensuel</div>
              </div>
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl p-4 text-center border border-green-500/30">
                <Gift className="w-6 h-6 text-green-400 mx-auto mb-2" />
                <div className="text-xl font-bold text-green-400">+{calculations.yearlyBenefit.toLocaleString('fr-FR')}€</div>
                <div className="text-xs text-green-300">bénéfice annuel</div>
              </div>
            </div>
          </Card>
        </motion>
      </div>
    </section>
  );
}
