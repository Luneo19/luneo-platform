'use client';

import React, { useState, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Settings, Code, AlertCircle, HelpCircle, DollarSign, Shield, RefreshCw, CreditCard, Zap } from 'lucide-react';
import { HeroSection } from './HeroSection';
import { StatsSection } from './StatsSection';
import { FeaturesSection } from './FeaturesSection';
import type { FeatureItem } from './FeaturesSection';
import { OverviewTab } from './OverviewTab';
import { SetupTab } from './SetupTab';
import type { InstallationStep } from './SetupTab';
import { CodeTab } from './CodeTab';
import { FAQTab } from './FAQTab';
import { PricingTab } from './PricingTab';
import { SecurityTab } from './SecurityTab';
import { TroubleshootingTab } from './TroubleshootingTab';
import { WebhooksTab } from './WebhooksTab';
import { CTASection } from './CTASection';

const STRIPE_FEATURES: FeatureItem[] = [
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: 'Paiements multidevises',
    description: 'Acceptez cartes, Apple Pay, Google Pay. 135+ devises, conversion automatique.',
    color: 'from-indigo-500 to-indigo-600',
    details: ['Cartes UE et international', '3D Secure 2', 'Retry automatique'],
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'Checkout optimisé',
    description: 'Taux de conversion maximisé avec Stripe Elements et localisation automatique.',
    color: 'from-green-500 to-green-600',
    details: ['Stripe Elements', 'One-click checkout', 'Sauvegarde des moyens de paiement'],
  },
  {
    icon: <Shield className="w-8 h-8" />,
    title: 'Conformité incluse',
    description: 'PCI DSS Level 1, SOC 2. Vous ne stockez jamais les numéros de carte.',
    color: 'from-purple-500 to-purple-600',
    details: ['PCI DSS Level 1', 'Chiffrement TLS 1.3', 'Conformité GDPR'],
  },
  {
    icon: <Globe className="w-8 h-8" />,
    title: 'International',
    description: 'Déployez dans le monde entier avec les bonnes devises et conformités locales.',
    color: 'from-pink-500 to-pink-600',
    details: ['135+ devises', 'Conversion auto', 'Support multilingue'],
  },
];

const DEFAULT_INSTALLATION_STEPS: InstallationStep[] = [
  {
    number: 1,
    title: 'Créer un compte Stripe',
    description: 'Inscrivez-vous sur stripe.com et récupérez vos clés API (Dashboard > Développeurs).',
    icon: <CreditCard className="w-6 h-6" />,
    color: 'from-indigo-500 to-indigo-600',
    details: ['Clé publique (pk_live_...)', 'Clé secrète (sk_live_...)'],
  },
  {
    number: 2,
    title: 'Configurer Luneo',
    description: 'Dans le cockpit Luneo, allez dans Intégrations > Stripe et collez vos clés.',
    icon: <Settings className="w-6 h-6" />,
    color: 'from-green-500 to-green-600',
    details: ['Coller la clé publique', 'Coller la clé secrète', 'Enregistrer'],
    code: '// Dans votre config Luneo\nSTRIPE_PUBLIC_KEY=pk_live_...\nSTRIPE_SECRET_KEY=sk_live_...',
  },
  {
    number: 3,
    title: 'Activer les webhooks',
    description: 'Ajoutez l\'URL de webhook Luneo dans le Dashboard Stripe (Développeurs > Webhooks).',
    icon: <RefreshCw className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
    details: ['URL: https://api.luneo.app/webhooks/stripe', 'Événements: payment_intent.*', 'charge.*'],
  },
];

const DEFAULT_CODE_EXAMPLES: Record<string, string> = {
  checkout: `const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_KEY);
const { error } = await stripe.redirectToCheckout({ sessionId });
if (error) console.error(error.message);`,
  webhook: `app.post('/webhooks/stripe', (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(body, sig, secret);
  if (event.type === 'payment_intent.succeeded') { /* ... */ }
  res.json({ received: true });
});`,
};

const DEFAULT_FAQ = [
  { question: 'Comment tester en mode sandbox ?', answer: 'Utilisez les clés de test (pk_test_... et sk_test_...) dans votre environnement de développement. Les paiements ne seront pas réels.' },
  { question: 'Quels frais Stripe applique-t-il ?', answer: 'Cartes UE : 1,5% + 0,25€ par transaction. Cartes hors UE : 2,5% + 0,25€. Aucun frais mensuel.' },
  { question: 'Comment gérer les remboursements ?', answer: 'Depuis le Dashboard Stripe ou via l\'API. Luneo reçoit les webhooks et met à jour automatiquement les commandes.' },
];

const DEFAULT_TROUBLESHOOTING = [
  { question: 'Erreur "Invalid API Key"', answer: 'Vérifiez que vous avez collé la clé secrète (sk_live_...) et non la clé publique. Vérifiez aussi qu\'il n\'y a pas d\'espace en trop.' },
  { question: 'Les webhooks ne sont pas reçus', answer: 'Vérifiez l\'URL dans Stripe Dashboard. L\'URL doit être en HTTPS. Vérifiez les logs Luneo pour voir les événements reçus.' },
];

export function StripeIntegrationContent() {
  const [activeTab, setActiveTab] = useState('overview');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string; details?: { name: string; status: string; message: string }[] } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const onTestConnection = useCallback(async () => {
    setTestConnectionLoading(true);
    setTestConnectionResult(null);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setTestConnectionResult({ success: true, message: 'Connexion Stripe OK. Les clés sont valides.' });
    } catch {
      setTestConnectionResult({ success: false, message: 'Impossible de vérifier la connexion.' });
    } finally {
      setTestConnectionLoading(false);
    }
  }, []);

  const onCopyCode = useCallback((code: string, id: string) => {
    void navigator.clipboard?.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  return (
    <main>
      <HeroSection />
      <StatsSection />
      <FeaturesSection features={STRIPE_FEATURES} />
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-12 h-auto p-1 bg-gray-100 rounded-lg">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Vue d&apos;ensemble</span>
              </TabsTrigger>
              <TabsTrigger value="setup" className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Installation
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2">
                <Code className="w-4 h-4" />
                Code
              </TabsTrigger>
              <TabsTrigger value="troubleshooting" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Dépannage</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Tarifs
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Sécurité</span>
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Webhooks
              </TabsTrigger>
            </TabsList>
            <TabsContent value="overview">
              <OverviewTab
                testConnectionLoading={testConnectionLoading}
                testConnectionResult={testConnectionResult}
                onTestConnection={onTestConnection}
              />
            </TabsContent>
            <TabsContent value="setup">
              <SetupTab
                installationSteps={DEFAULT_INSTALLATION_STEPS}
                copiedCode={copiedCode}
                onCopyCode={onCopyCode}
              />
            </TabsContent>
            <TabsContent value="code">
              <CodeTab
                codeExamples={DEFAULT_CODE_EXAMPLES}
                copiedCode={copiedCode}
                onCopyCode={onCopyCode}
              />
            </TabsContent>
            <TabsContent value="troubleshooting">
              <TroubleshootingTab items={DEFAULT_TROUBLESHOOTING} />
            </TabsContent>
            <TabsContent value="faq">
              <FAQTab items={DEFAULT_FAQ} />
            </TabsContent>
            <TabsContent value="pricing">
              <PricingTab />
            </TabsContent>
            <TabsContent value="security">
              <SecurityTab />
            </TabsContent>
            <TabsContent value="webhooks">
              <WebhooksTab />
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <CTASection />
    </main>
  );
}
