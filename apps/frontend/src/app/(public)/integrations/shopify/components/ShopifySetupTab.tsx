'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowRight, BookOpen, CheckCircle2, Shield } from 'lucide-react';
import Link from 'next/link';

export function ShopifySetupTab() {
  return (
    <>
      <Card className="p-6 md:p-8 bg-gray-800/50 border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">Guide d&apos;Installation Étape par Étape</h3>
        <div className="space-y-6">
          <div className="border-l-4 border-green-500 pl-6">
            <h4 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
              Installer l&apos;app depuis le Shopify App Store
            </h4>
            <p className="text-gray-300 mb-4">
              Rendez-vous sur le{' '}
              <Link href="https://apps.shopify.com/luneo" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 hover:underline font-semibold">
                Shopify App Store
              </Link>
              {' '}et cliquez sur &quot;Installer&quot;. L&apos;app demandera les permissions nécessaires pour fonctionner.
            </p>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-300 mb-2 font-semibold">Permissions requises:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                <li>read_products - Lire vos produits</li>
                <li>write_products - Modifier vos produits</li>
                <li>read_orders - Lire vos commandes</li>
                <li>write_orders - Créer/modifier commandes</li>
                <li>read_customers - Lire informations clients</li>
                <li>write_script_tags - Ajouter scripts personnalisation</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-blue-500 pl-6">
            <h4 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
              Configurer votre compte Luneo
            </h4>
            <p className="text-gray-300 mb-4">
              Après l&apos;installation, vous serez redirigé vers Luneo pour créer votre compte ou vous connecter.
              Si vous n&apos;avez pas encore de compte, l&apos;inscription est gratuite et prend moins de 2 minutes.
            </p>
            <Link href="/register">
              <Button variant="outline" className="mt-2 border-gray-600 text-white hover:bg-gray-700">
                Créer un compte Luneo
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          <div className="border-l-4 border-purple-500 pl-6">
            <h4 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
              Autoriser la connexion
            </h4>
            <p className="text-gray-300 mb-4">
              Autorisez Luneo à accéder à votre boutique Shopify. Cette étape est sécurisée et utilise OAuth 2.0.
              Vous pouvez révoquer l&apos;accès à tout moment depuis les paramètres Shopify.
            </p>
            <div className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg">
              <p className="text-sm text-blue-200">
                <Shield className="w-4 h-4 inline mr-2" />
                <strong>Sécurité:</strong> Vos credentials ne sont jamais stockés en clair. Nous utilisons le chiffrement AES-256-GCM.
              </p>
            </div>
          </div>

          <div className="border-l-4 border-orange-500 pl-6">
            <h4 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
              Configurer les webhooks (automatique)
            </h4>
            <p className="text-gray-300 mb-4">
              Les webhooks sont configurés automatiquement lors de l&apos;installation. Ils permettent la synchronisation
              bidirectionnelle entre Shopify et Luneo.
            </p>
            <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-300 mb-2 font-semibold">Webhooks configurés:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-300">
                <li>orders/create - Nouvelles commandes</li>
                <li>orders/updated - Mises à jour commandes</li>
                <li>products/create - Nouveaux produits</li>
                <li>products/update - Mises à jour produits</li>
              </ul>
            </div>
          </div>

          <div className="border-l-4 border-green-500 pl-6">
            <h4 className="text-xl font-semibold text-white mb-2 flex items-center gap-2">
              <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
              Ajouter le widget à vos produits
            </h4>
            <p className="text-gray-300 mb-4">
              Le widget de personnalisation est automatiquement ajouté à toutes vos pages produits.
              Vous pouvez également l&apos;ajouter manuellement si vous utilisez un thème personnalisé.
            </p>
            <p className="text-sm text-gray-500">
              Voir l&apos;onglet &quot;Code&quot; pour les instructions d&apos;installation manuelle.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 md:p-8 bg-green-50 border-2 border-green-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-green-600" />
          Installation terminée !
        </h3>
        <p className="text-gray-700 mb-4">
          Votre intégration Shopify est maintenant configurée. Vous pouvez commencer à personnaliser vos produits
          et voir les designs apparaître automatiquement dans vos commandes Shopify.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard/integrations-dashboard">
            <Button className="bg-green-600 hover:bg-green-700 text-white">
              Accéder au dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
          <Link href="/help/documentation/integrations/shopify">
            <Button variant="outline">
              <BookOpen className="w-4 h-4 mr-2" />
              Documentation complète
            </Button>
          </Link>
        </div>
      </Card>
    </>
  );
}
