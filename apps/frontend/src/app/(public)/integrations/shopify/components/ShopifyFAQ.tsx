'use client';

import { Card } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const faqItems = [
  {
    question: 'Combien coûte l\'intégration Shopify ?',
    answer: 'L\'app Shopify est gratuite à installer. Vous payez uniquement votre abonnement Luneo (à partir de 29€/mois). Aucun frais supplémentaire pour l\'intégration Shopify.',
  },
  {
    question: 'Puis-je utiliser Luneo avec plusieurs boutiques Shopify ?',
    answer: 'Oui ! Vous pouvez connecter plusieurs boutiques Shopify à un seul compte Luneo. Chaque boutique a ses propres paramètres et synchronisations.',
  },
  {
    question: 'Les designs sont-ils stockés sur les serveurs Luneo ?',
    answer: 'Oui, les designs sont stockés de manière sécurisée sur nos serveurs avec sauvegarde automatique. Vous pouvez également exporter vos designs pour sauvegarde locale.',
  },
  {
    question: 'Puis-je personnaliser l\'apparence du widget ?',
    answer: 'Oui ! Le widget est entièrement personnalisable via CSS et les options de configuration. Vous pouvez adapter les couleurs, polices, et layout à votre thème Shopify.',
  },
  {
    question: 'Y a-t-il une limite au nombre de produits personnalisables ?',
    answer: 'Non, il n\'y a pas de limite au nombre de produits. Vous pouvez personnaliser tous vos produits Shopify sans restriction.',
  },
  {
    question: 'Comment puis-je obtenir de l\'aide ?',
    answer: 'Notre équipe support est disponible 7j/7 via email, chat, ou téléphone. Nous offrons également des sessions d\'onboarding gratuites pour vous aider à démarrer.',
  },
];

export function ShopifyFAQ() {
  return (
    <Card className="p-6 md:p-8">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Questions Fréquentes</h3>
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-left font-semibold text-gray-900">
              {item.question}
            </AccordionTrigger>
            <AccordionContent className="text-gray-600">
              {item.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  );
}
