'use client';

import React, { useState, useMemo, memo } from 'react';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TrendingUp, DollarSign, Clock, Package, Zap } from 'lucide-react';

function ROICalculator() {
  const [ordersPerMonth, setOrdersPerMonth] = useState(500);
  const [avgOrderValue, setAvgOrderValue] = useState(75);
  const [returnRate, setReturnRate] = useState(25);
  const [designTimeHours, setDesignTimeHours] = useState(2);

  // Calculs mémorisés pour éviter recalculs inutiles
  const calculations = useMemo(() => {
    // Calculs actuels
    const currentRevenue = ordersPerMonth * avgOrderValue;
    const currentReturns = (currentRevenue * returnRate) / 100;
    const currentDesignCost = ordersPerMonth * designTimeHours * 25; // €25/h
    const currentTotalCost = currentReturns + currentDesignCost;

    // Avec Luneo
    const newConversionRate = 1.4; // +40%
    const newOrdersPerMonth = Math.round(ordersPerMonth * newConversionRate);
    const _newReturnRate = returnRate * 0.35; // -65% retours
    const newRevenue = newOrdersPerMonth * avgOrderValue;
    const newReturns = (newRevenue * _newReturnRate) / 100;
    const newDesignCost = newOrdersPerMonth * 0.05 * 25; // 5% du temps original
    const newTotalCost = newReturns + newDesignCost;

    const savings = currentTotalCost - newTotalCost;
    const revenueGain = newRevenue - currentRevenue;
    const totalImpact = savings + revenueGain;
    const annualImpact = totalImpact * 12;
    const roi = ((totalImpact - 299) / 299) * 100; // Plan Business €299/mois

    return {
      currentRevenue,
      currentReturns,
      currentDesignCost,
      currentTotalCost,
      newOrdersPerMonth,
      newRevenue,
      newReturns,
      newDesignCost,
      newTotalCost,
      savings,
      revenueGain,
      totalImpact,
      annualImpact,
      roi,
    };
  }, [ordersPerMonth, avgOrderValue, returnRate, designTimeHours]);

  const {
    currentRevenue,
    currentReturns,
    currentDesignCost,
    currentTotalCost,
    newOrdersPerMonth,
    newRevenue,
    newReturns,
    newDesignCost,
    newTotalCost,
    savings,
    revenueGain,
    totalImpact,
    annualImpact,
    roi,
  } = calculations;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="p-8 bg-gradient-to-br from-white to-blue-50 shadow-2xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Calculateur ROI Luneo
          </h2>
          <p className="text-gray-600">
            Découvrez combien vous pourriez économiser et gagner
          </p>
        </div>

        {/* Inputs */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Commandes par mois
            </label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[ordersPerMonth]}
                onValueChange={(value) => setOrdersPerMonth(value[0])}
                min={50}
                max={5000}
                step={50}
                className="flex-1"
              />
              <span className="text-2xl font-bold text-blue-600 w-24 text-right">
                {ordersPerMonth}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Panier moyen (€)
            </label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[avgOrderValue]}
                onValueChange={(value) => setAvgOrderValue(value[0])}
                min={20}
                max={500}
                step={5}
                className="flex-1"
              />
              <span className="text-2xl font-bold text-blue-600 w-24 text-right">
                €{avgOrderValue}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Taux de retour (%)
            </label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[returnRate]}
                onValueChange={(value) => setReturnRate(value[0])}
                min={5}
                max={50}
                step={1}
                className="flex-1"
              />
              <span className="text-2xl font-bold text-blue-600 w-24 text-right">
                {returnRate}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Temps design par commande (h)
            </label>
            <div className="flex items-center space-x-4">
              <Slider
                value={[designTimeHours]}
                onValueChange={(value) => setDesignTimeHours(value[0])}
                min={0.5}
                max={8}
                step={0.5}
                className="flex-1"
              />
              <span className="text-2xl font-bold text-blue-600 w-24 text-right">
                {designTimeHours}h
              </span>
            </div>
          </div>
        </div>

        {/* Comparaison Avant/Après */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Sans Luneo */}
          <Card className="p-6 bg-red-50 border-2 border-red-200">
            <h3 className="text-xl font-bold text-red-900 mb-4 flex items-center">
              <span className="mr-2">❌</span> Sans Luneo
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Commandes/mois:</span>
                <span className="font-bold text-gray-900">{ordersPerMonth}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Revenue:</span>
                <span className="font-bold text-gray-900">
                  €{currentRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Coût retours:</span>
                <span className="font-bold text-red-600">
                  -€{currentReturns.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Coût design:</span>
                <span className="font-bold text-red-600">
                  -€{currentDesignCost.toLocaleString()}
                </span>
              </div>
              <div className="border-t-2 border-red-300 pt-3 flex justify-between">
                <span className="font-bold text-red-900">Coût total:</span>
                <span className="font-bold text-red-600 text-lg">
                  -€{currentTotalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Avec Luneo */}
          <Card className="p-6 bg-green-50 border-2 border-green-200">
            <h3 className="text-xl font-bold text-green-900 mb-4 flex items-center">
              <span className="mr-2">✅</span> Avec Luneo
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-700">Commandes/mois:</span>
                <span className="font-bold text-green-600">
                  {newOrdersPerMonth} <span className="text-xs">(+40%)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Revenue:</span>
                <span className="font-bold text-green-600">
                  €{newRevenue.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Coût retours:</span>
                <span className="font-bold text-green-600">
                  -€{newReturns.toLocaleString()} <span className="text-xs">(-65%)</span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Coût design:</span>
                <span className="font-bold text-green-600">
                  -€{newDesignCost.toLocaleString()} <span className="text-xs">(-95%)</span>
                </span>
              </div>
              <div className="border-t-2 border-green-300 pt-3 flex justify-between">
                <span className="font-bold text-green-900">Coût total:</span>
                <span className="font-bold text-green-600 text-lg">
                  -€{newTotalCost.toLocaleString()}
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Résultats imposants */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white">
          <h3 className="text-2xl font-bold mb-6 text-center">
            Votre ROI avec Luneo
          </h3>

          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-white/20">
                <DollarSign className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold mb-1">
                €{totalImpact.toLocaleString()}
              </div>
              <div className="text-sm opacity-90">Gain mensuel</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-white/20">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold mb-1">
                €{annualImpact.toLocaleString()}
              </div>
              <div className="text-sm opacity-90">Gain annuel</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-white/20">
                <Zap className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {Math.round(roi)}%
              </div>
              <div className="text-sm opacity-90">ROI mensuel</div>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 rounded-full bg-white/20">
                <Clock className="w-6 h-6" />
              </div>
              <div className="text-3xl font-bold mb-1">
                {Math.round((designTimeHours * ordersPerMonth * 0.95) / 160)}
              </div>
              <div className="text-sm opacity-90">ETP économisés</div>
            </div>
          </div>

          <div className="mt-8 p-6 bg-white/10 rounded-lg text-center backdrop-blur-sm">
            <div className="text-sm uppercase tracking-wide opacity-90 mb-2">
              Investissement Luneo (Plan Business)
            </div>
            <div className="text-4xl font-bold mb-2">€299/mois</div>
            <div className="text-lg">
              Retour sur investissement en{' '}
              <span className="font-bold">
                {Math.ceil((299 / totalImpact) * 30)} jours
              </span>
            </div>
          </div>
        </div>

        {/* Breakdown détaillé */}
        <div className="mt-8 grid md:grid-cols-3 gap-6">
          <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white mr-3">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Économies</div>
                <div className="text-2xl font-bold text-green-600">
                  €{savings.toLocaleString()}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Réduction coûts retours + design automation
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Revenue additionnel</div>
                <div className="text-2xl font-bold text-blue-600">
                  €{revenueGain.toLocaleString()}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              +40% conversion grâce à visualisation 3D/AR
            </p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white mr-3">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm text-gray-600">Capacité boost</div>
                <div className="text-2xl font-bold text-purple-600">
                  +{newOrdersPerMonth - ordersPerMonth}
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-700">
              Commandes additionnelles/mois sans embauche
            </p>
          </Card>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            *Calculs basés sur moyennes clients Luneo. Résultats individuels peuvent varier.
            <br />
            Hypothèses: +40% conversion, -65% retours, -95% temps design, coût main d'œuvre €25/h.
          </p>
        </div>
      </Card>
    </div>
  );
}

const ROICalculatorMemo = memo(ROICalculator);

export default function ROICalculatorWithErrorBoundary() {
  return (
    <ErrorBoundary componentName="ROICalculator">
      <ROICalculatorMemo />
    </ErrorBoundary>
  );
}

