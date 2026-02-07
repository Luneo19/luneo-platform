'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, XCircle, Zap, MessageSquare, Star, Users, Award, Play, Settings, BookOpen, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export interface TestConnectionResult {
  success: boolean;
  message: string;
  details?: { name: string; status: string; message: string }[];
}

interface OverviewTabProps {
  testConnectionLoading: boolean;
  testConnectionResult: TestConnectionResult | null;
  onTestConnection: () => void;
}

export function OverviewTab({ testConnectionLoading, testConnectionResult, onTestConnection }: OverviewTabProps) {
  const overviewItems = [
    { icon: <TrendingUp className="w-6 h-6 text-green-600" />, title: 'Augmentation des conversions', description: "Les boutiques avec personnalisation Luneo voient +35% de conversion en moyenne. Les clients voient exactement ce qu'ils achètent.", stats: '+35% conversion' },
    { icon: <XCircle className="w-6 h-6 text-red-600" />, title: 'Réduction des retours', description: "Réduisez les retours de 40% en moyenne. Les clients sont satisfaits car ils voient le produit personnalisé avant l'achat.", stats: '-40% retours' },
    { icon: <Zap className="w-6 h-6 text-blue-600" />, title: 'Intégration native WordPress', description: "Intégration 100% native avec WordPress et WooCommerce. Hooks standards, compatible tous thèmes et plugins.", stats: '100% natif' },
    { icon: <MessageSquare className="w-6 h-6 text-purple-600" />, title: 'Support premium', description: "Support 7j/7, réponse sous 2h. Onboarding gratuit, documentation et exemples de code.", stats: '7j/7 support' },
  ];
  const stats = [
    { value: '+35%', label: 'Conversion', color: 'text-green-600' },
    { value: '-40%', label: 'Retours', color: 'text-red-600' },
    { value: '+28%', label: 'Panier moyen', color: 'text-purple-600' },
    { value: '10min', label: 'Installation', color: 'text-orange-600' },
  ];

  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Pourquoi choisir Luneo pour WooCommerce ?</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {overviewItems.map((item, idx) => (
            <div key={idx} className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">{item.icon}</div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                  <div className="text-sm font-semibold text-blue-600">{item.stats}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-8 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Statistiques de Performance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              <span className="text-2xl font-bold text-gray-900">4.9/5</span>
            </div>
            <p className="text-sm text-gray-600">Note moyenne WordPress.org</p>
          </div>
          <div className="p-6 bg-white rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-6 h-6 text-blue-500" />
              <span className="text-2xl font-bold text-gray-900">50K+</span>
            </div>
            <p className="text-sm text-gray-600">Installations actives</p>
          </div>
          <div className="p-6 bg-white rounded-xl">
            <div className="flex items-center gap-3 mb-3">
              <Award className="w-6 h-6 text-purple-500" />
              <span className="text-2xl font-bold text-gray-900">100%</span>
            </div>
            <p className="text-sm text-gray-600">Satisfaction client</p>
          </div>
        </div>
      </Card>
      <Card className="p-8 md:p-10 border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-white">
        <h3 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
          <Zap className="w-8 h-8 text-blue-600" />
          Test de Connexion WooCommerce
        </h3>
        <p className="text-lg text-gray-600 mb-8">
          Testez votre connexion WooCommerce. Le test vérifie WordPress, WooCommerce, les permissions et l&apos;API REST.
        </p>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={onTestConnection} disabled={testConnectionLoading} size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg">
              {testConnectionLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Test en cours...</> : <><Play className="w-5 h-5 mr-2" />Tester la connexion</>}
            </Button>
            <Link href="/dashboard/integrations"><Button variant="outline" size="lg" className="px-8 py-6 text-lg"><Settings className="w-5 h-5 mr-2" />Configurer l&apos;intégration</Button></Link>
            <Link href="/help/documentation/integrations/woocommerce"><Button variant="outline" size="lg" className="px-8 py-6 text-lg"><BookOpen className="w-5 h-5 mr-2" />Guide d&apos;installation</Button></Link>
          </div>
          <AnimatePresence>
            {testConnectionResult && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                <Alert className={testConnectionResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                  <div className="flex items-start gap-3">
                    {testConnectionResult.success ? <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" /> : <XCircle className="w-6 h-6 text-red-600 mt-0.5" />}
                    <div className="flex-1">
                      <AlertTitle className={testConnectionResult.success ? 'text-green-900 text-lg' : 'text-red-900 text-lg'}>{testConnectionResult.success ? 'Connexion réussie' : 'Erreur de connexion'}</AlertTitle>
                      <AlertDescription className={testConnectionResult.success ? 'text-green-800 mt-2' : 'text-red-800 mt-2'}>{testConnectionResult.message}</AlertDescription>
                    </div>
                  </div>
                </Alert>
                {testConnectionResult.details && (
                  <div className="space-y-2">
                    {testConnectionResult.details.map((check, idx) => (
                      <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                        {check.status === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">{check.name}</div>
                          <div className="text-sm text-gray-600">{check.message}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
