'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, Loader2, Play, Settings, XCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import { ShopifyPricing } from './ShopifyPricing';

type TestResult = { success: boolean; message: string } | null;

export function ShopifyOverviewTab({
  testConnectionLoading,
  testConnectionResult,
  onTestConnection,
}: {
  testConnectionLoading: boolean;
  testConnectionResult: TestResult;
  onTestConnection: () => Promise<void>;
}) {
  return (
    <>
      <Card className="p-6 md:p-8 bg-gray-800/50 border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">Pourquoi choisir Luneo pour Shopify ?</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Augmentation des conversions
            </h4>
            <p className="text-gray-300 mb-4">
              Les boutiques avec personnalisation Luneo voient une augmentation moyenne de 35% de leur taux de conversion.
              Les clients peuvent voir exactement ce qu&apos;ils achètent avant de commander.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Réduction des retours
            </h4>
            <p className="text-gray-300 mb-4">
              Réduisez les retours de 40% en moyenne. Les clients sont satisfaits car ils voient exactement
              le produit personnalisé avant l&apos;achat.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Intégration native
            </h4>
            <p className="text-gray-300 mb-4">
              Intégration 100% native avec Shopify. Synchronisation automatique des produits, commandes,
              et inventaire. Aucune configuration complexe requise.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              Support premium
            </h4>
            <p className="text-gray-300 mb-4">
              Support dédié 7j/7 avec réponse sous 2h. Onboarding gratuit et sessions de formation
              pour votre équipe.
            </p>
          </div>
        </div>
      </Card>

      <ShopifyPricing />

      <Card className="p-6 md:p-8 bg-gray-800/50 border-2 border-green-500/20 border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
          <Zap className="w-6 h-6 text-green-400" />
          Test de Connexion
        </h3>
        <p className="text-gray-300 mb-6">
          Testez votre connexion Shopify pour vérifier que tout est correctement configuré.
        </p>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              onClick={onTestConnection}
              disabled={testConnectionLoading}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {testConnectionLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Test en cours...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Tester la connexion
                </>
              )}
            </Button>
            <Link href="/dashboard/integrations-dashboard">
              <Button variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Configurer l&apos;intégration
              </Button>
            </Link>
          </div>
          <AnimatePresence>
            {testConnectionResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert className={testConnectionResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                  {testConnectionResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <AlertTitle className={testConnectionResult.success ? 'text-green-900' : 'text-red-900'}>
                    {testConnectionResult.success ? 'Connexion réussie' : 'Erreur de connexion'}
                  </AlertTitle>
                  <AlertDescription className={testConnectionResult.success ? 'text-green-800' : 'text-red-800'}>
                    {testConnectionResult.message}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </>
  );
}
