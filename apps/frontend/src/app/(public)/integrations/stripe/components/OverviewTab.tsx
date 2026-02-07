'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Zap, Shield, Globe, Star, Users, Award, Play, Settings, BookOpen, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface OverviewTabProps {
  testConnectionLoading: boolean;
  testConnectionResult: { success: boolean; message: string; details?: { name: string; status: string; message: string }[] } | null;
  onTestConnection: () => void;
}

export function OverviewTab({ testConnectionLoading, testConnectionResult, onTestConnection }: OverviewTabProps) {
  const items = [
    { icon: <CreditCard className="w-6 h-6 text-indigo-600" />, title: 'Paiements sécurisés', description: 'Cartes, Apple Pay, Google Pay. PCI DSS Level 1, 3D Secure 2.', stats: '40+ méthodes' },
    { icon: <Zap className="w-6 h-6 text-blue-600" />, title: 'Checkout optimisé', description: 'Taux de conversion optimisé, localisation auto, retry automatique.', stats: 'Conversion +' },
    { icon: <Shield className="w-6 h-6 text-green-600" />, title: 'Conformité incluse', description: 'PCI DSS, SOC 2, GDPR. Vous ne stockez pas les numéros de carte.', stats: 'Conformité' },
    { icon: <Globe className="w-6 h-6 text-purple-600" />, title: 'International', description: '135+ devises, conversion auto, conformité locale.', stats: '135+ devises' },
  ];
  const stats = [
    { value: '40+', label: 'Méthodes', color: 'text-indigo-600' },
    { value: '135+', label: 'Devises', color: 'text-green-600' },
    { value: '99.99%', label: 'Uptime', color: 'text-purple-600' },
    { value: '10min', label: 'Config', color: 'text-pink-600' },
  ];
  return (
    <div className="space-y-8">
      <Card className="p-8 md:p-10">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Pourquoi Stripe avec Luneo ?</h3>
        <div className="grid md:grid-cols-2 gap-8">
          {items.map((item, idx) => (
            <div key={idx} className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">{item.icon}</div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                  <p className="text-gray-600 mb-3 leading-relaxed">{item.description}</p>
                  <div className="text-sm font-semibold text-indigo-600">{item.stats}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-8 md:p-10 bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
        <h3 className="text-3xl font-bold text-gray-900 mb-8">Statistiques Stripe</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          {stats.map((s, idx) => (
            <div key={idx} className="text-center p-6 bg-white rounded-xl shadow-sm">
              <div className={`text-4xl font-bold ${s.color} mb-2`}>{s.value}</div>
              <div className="text-sm text-gray-600">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl"><div className="flex items-center gap-3 mb-3"><Star className="w-6 h-6 text-yellow-500 fill-yellow-500" /><span className="text-2xl font-bold text-gray-900">4.9/5</span></div><p className="text-sm text-gray-600">Satisfaction développeurs</p></div>
          <div className="p-6 bg-white rounded-xl"><div className="flex items-center gap-3 mb-3"><Users className="w-6 h-6 text-indigo-500" /><span className="text-2xl font-bold text-gray-900">Millions</span></div><p className="text-sm text-gray-600">Entreprises</p></div>
          <div className="p-6 bg-white rounded-xl"><div className="flex items-center gap-3 mb-3"><Award className="w-6 h-6 text-purple-500" /><span className="text-2xl font-bold text-gray-900">99.99%</span></div><p className="text-sm text-gray-600">Uptime SLA</p></div>
        </div>
      </Card>
      <Card className="p-8 md:p-10 border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-white">
        <h3 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3"><Zap className="w-8 h-8 text-indigo-600" />Test de Connexion Stripe</h3>
        <p className="text-lg text-gray-600 mb-8">Vérifiez vos clés API, webhook et permissions.</p>
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={onTestConnection} disabled={testConnectionLoading} size="lg" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg">
              {testConnectionLoading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Test...</> : <><Play className="w-5 h-5 mr-2" />Tester la connexion</>}
            </Button>
            <Link href="/dashboard/integrations"><Button variant="outline" size="lg" className="px-8 py-6 text-lg"><Settings className="w-5 h-5 mr-2" />Configurer</Button></Link>
            <Link href="/help/documentation/integrations/stripe"><Button variant="outline" size="lg" className="px-8 py-6 text-lg"><BookOpen className="w-5 h-5 mr-2" />Guide</Button></Link>
          </div>
          <AnimatePresence>
            {testConnectionResult && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
                <Alert className={testConnectionResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                  <div className="flex items-start gap-3">
                    {testConnectionResult.success ? <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" /> : <XCircle className="w-6 h-6 text-red-600 mt-0.5" />}
                    <div className="flex-1">
                      <AlertTitle className={testConnectionResult.success ? 'text-green-900 text-lg' : 'text-red-900 text-lg'}>{testConnectionResult.success ? 'Connexion réussie' : 'Erreur'}</AlertTitle>
                      <AlertDescription className={testConnectionResult.success ? 'text-green-800 mt-2' : 'text-red-800 mt-2'}>{testConnectionResult.message}</AlertDescription>
                    </div>
                  </div>
                </Alert>
                {testConnectionResult.details?.map((check, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                    {check.status === 'success' ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                    <div className="flex-1"><div className="font-semibold text-gray-900">{check.name}</div><div className="text-sm text-gray-600">{check.message}</div></div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
