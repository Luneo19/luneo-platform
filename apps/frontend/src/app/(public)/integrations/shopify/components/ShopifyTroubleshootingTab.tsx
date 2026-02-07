'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { HelpCircle, MessageSquare } from 'lucide-react';
import Link from 'next/link';

const troubleshootingItems = [
  {
    question: 'Le widget ne s\'affiche pas sur ma page produit',
    answer: `Vérifiez que:
1. Le script Luneo est bien chargé (vérifiez la console navigateur)
2. L'API Key est correcte dans votre configuration
3. Le product ID correspond bien au produit Shopify
4. Aucune erreur JavaScript dans la console

Si le problème persiste, contactez le support avec les logs de la console.`,
  },
  {
    question: 'Les designs ne sont pas synchronisés avec Shopify',
    answer: `Assurez-vous que:
1. Les webhooks sont correctement configurés dans Shopify Admin
2. L'URL du webhook pointe vers https://api.luneo.app/webhooks/shopify
3. Les permissions de l'app incluent read_orders et write_orders
4. Votre plan Luneo inclut la synchronisation automatique

Vérifiez les logs dans votre dashboard Luneo > Intégrations > Shopify.`,
  },
  {
    question: 'Les prix ne se mettent pas à jour automatiquement',
    answer: `Pour activer les prix dynamiques:
1. Allez dans Luneo Dashboard > Intégrations > Shopify
2. Activez "Prix dynamiques" dans les paramètres
3. Configurez les règles de pricing dans Products > Pricing Rules
4. Vérifiez que les variants Shopify correspondent aux options Luneo

Les prix sont calculés en temps réel selon les personnalisations.`,
  },
  {
    question: 'L\'AR Try-On ne fonctionne pas sur mobile',
    answer: `Vérifiez que:
1. Vous utilisez iOS 12+ ou Android 8+ avec Chrome
2. Les modèles 3D sont au format USDZ (iOS) ou GLB (Android)
3. Les permissions caméra sont accordées
4. Vous testez sur un appareil physique (pas simulateur)

Pour iOS: Le modèle doit être en USDZ et accessible via HTTPS.
Pour Android: Le modèle doit être en GLB et accessible via HTTPS.`,
  },
  {
    question: 'Les fichiers print-ready ne sont pas générés',
    answer: `Assurez-vous que:
1. Votre plan inclut l'export print-ready
2. Le design est finalisé (status: completed)
3. Les dimensions sont définies (largeur x hauteur)
4. Le format est supporté (PNG, PDF, SVG)

Les fichiers sont générés automatiquement après finalisation du design.
Vérifiez dans Orders > [Order ID] > Production Files.`,
  },
];

export function ShopifyTroubleshootingTab() {
  return (
    <>
      <Card className="p-6 md:p-8 bg-gray-800/50 border-gray-700">
        <h3 className="text-2xl font-bold text-white mb-6">Dépannage</h3>
        <Accordion type="single" collapsible className="w-full">
          {troubleshootingItems.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border-gray-700">
              <AccordionTrigger className="text-left font-semibold text-white hover:text-gray-200">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-gray-400 whitespace-pre-line">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </Card>

      <Card className="p-6 md:p-8 bg-yellow-50 border-2 border-yellow-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-yellow-600" />
          Besoin d&apos;aide supplémentaire ?
        </h3>
        <p className="text-gray-700 mb-4">
          Notre équipe support est disponible 7j/7 pour vous aider. Contactez-nous et nous répondrons sous 2h.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/contact">
            <Button className="bg-yellow-600 hover:bg-yellow-700 text-white">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contacter le support
            </Button>
          </Link>
          <Link href="/help/support">
            <Button variant="outline">
              <HelpCircle className="w-4 h-4 mr-2" />
              Centre d&apos;aide
            </Button>
          </Link>
        </div>
      </Card>
    </>
  );
}
