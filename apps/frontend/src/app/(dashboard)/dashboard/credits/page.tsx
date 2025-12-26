'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CreditCard,
  Zap,
  TrendingUp,
  History,
  Plus,
  Gift,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

/**
 * Gestion des crédits
 * Achat et suivi des crédits IA
 */
export default function CreditsPage() {
  const [currentCredits] = useState(1250);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const creditPacks = useMemo(() => [
    { id: 'starter', name: 'Starter', credits: 500, price: 9.99, popular: false },
    { id: 'pro', name: 'Pro', credits: 2000, price: 29.99, popular: true },
    { id: 'enterprise', name: 'Enterprise', credits: 10000, price: 99.99, popular: false },
  ], []);

  const recentTransactions = useMemo(() => [
    { id: '1', type: 'purchase', amount: 2000, date: '2024-01-15', description: 'Achat pack Pro' },
    { id: '2', type: 'usage', amount: -50, date: '2024-01-14', description: 'Génération image IA' },
    { id: '3', type: 'usage', amount: -100, date: '2024-01-13', description: 'Génération modèle 3D' },
    { id: '4', type: 'bonus', amount: 100, date: '2024-01-12', description: 'Bonus de bienvenue' },
  ], []);

  return (
    <ErrorBoundary componentName="Credits">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Zap className="w-8 h-8 text-cyan-400" />
              Crédits
            </h1>
            <p className="text-slate-400 mt-2">
              Gérez vos crédits pour utiliser les fonctionnalités IA
            </p>
          </div>
        </div>

        {/* Current Credits */}
        <Card className="bg-gradient-to-br from-cyan-950/50 to-blue-950/50 border-cyan-500/20">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 mb-2">Crédits disponibles</p>
                <div className="flex items-baseline gap-3">
                  <h2 className="text-5xl font-bold text-white">{currentCredits.toLocaleString()}</h2>
                  <Badge className="bg-green-500">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Actif
                  </Badge>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-sm mb-1">Valeur estimée</p>
                <p className="text-2xl font-bold text-cyan-400">
                  €{((currentCredits / 100) * 0.10).toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Purchase Plans */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-cyan-400" />
                  Acheter des crédits
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Choisissez un pack de crédits adapté à vos besoins
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {creditPacks.map((pack) => (
                    <motion.div
                      key={pack.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`relative p-6 rounded-lg border-2 transition-all cursor-pointer ${
                        selectedPlan === pack.id
                          ? 'border-cyan-500 bg-cyan-950/20'
                          : pack.popular
                          ? 'border-cyan-500/50 bg-slate-800/50 hover:border-cyan-500'
                          : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                      }`}
                      onClick={() => setSelectedPlan(pack.id)}
                    >
                      {pack.popular && (
                        <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-cyan-500">
                          Populaire
                        </Badge>
                      )}
                      <div className="text-center">
                        <h3 className="text-xl font-bold text-white mb-2">{pack.name}</h3>
                        <div className="mb-4">
                          <p className="text-3xl font-bold text-cyan-400">{pack.credits.toLocaleString()}</p>
                          <p className="text-sm text-slate-400">crédits</p>
                        </div>
                        <p className="text-2xl font-bold text-white mb-4">€{pack.price}</p>
                        <Button
                          className={`w-full ${
                            selectedPlan === pack.id
                              ? 'bg-cyan-600 hover:bg-cyan-700'
                              : 'bg-slate-700 hover:bg-slate-600'
                          }`}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Acheter
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Statistiques d'utilisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-cyan-400">1,250</p>
                    <p className="text-sm text-slate-400">Crédits utilisés</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-green-400">85%</p>
                    <p className="text-sm text-slate-400">Taux d'utilisation</p>
                  </div>
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg">
                    <p className="text-2xl font-bold text-purple-400">42</p>
                    <p className="text-sm text-slate-400">Générations</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - History */}
          <div className="space-y-6">
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  Historique
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentTransactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50"
                    >
                      <div>
                        <p className="text-sm font-medium text-white">{transaction.description}</p>
                        <p className="text-xs text-slate-400">{transaction.date}</p>
                      </div>
                      <div className={`text-sm font-bold ${
                        transaction.amount > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Bonus */}
            <Card className="bg-gradient-to-br from-purple-950/50 to-pink-950/50 border-purple-500/20">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                    <Gift className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">Bonus disponible</h3>
                    <p className="text-xs text-slate-400">Invitez un ami</p>
                  </div>
                </div>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Obtenir 100 crédits
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}

