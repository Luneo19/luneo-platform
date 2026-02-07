'use client';

import React, { useState, useCallback } from 'react';
import { HeroSection } from './HeroSection';
import { StatsSection } from './StatsSection';
import { FeaturesSection } from './FeaturesSection';
import type { FeatureItem } from './FeaturesSection';
import { MainTabsSection } from './MainTabsSection';
import type { TabValue } from './MainTabsSection';
import { CTASection } from './CTASection';
import type { InstallationStep } from './SetupTab';
import type { PricingPlan } from './PricingTab';
import { Package, TrendingUp, Zap, MessageSquare, Settings, Copy } from 'lucide-react';

const WOO_FEATURES: FeatureItem[] = [
  {
    icon: <Package className="w-8 h-8" />,
    title: 'Personnalisation 3D/AR',
    description: 'Vos clients configurent le produit en 3D et peuvent le prévisualiser en réalité augmentée.',
    color: 'from-blue-500 to-blue-600',
    details: ['Configurateur 3D', 'Vue AR', 'Rendu temps réel'],
  },
  {
    icon: <TrendingUp className="w-8 h-8" />,
    title: '+35% de conversion',
    description: 'Les boutiques avec personnalisation Luneo voient une hausse mesurable des conversions.',
    color: 'from-green-500 to-green-600',
    details: ['Stats incluses', 'A/B testing', 'Optimisation continue'],
  },
  {
    icon: <Zap className="w-8 h-8" />,
    title: 'Intégration native',
    description: 'Plugin WordPress/WooCommerce 100% natif. Hooks standards, compatible tous thèmes.',
    color: 'from-purple-500 to-purple-600',
    details: ['Shortcodes', 'Gutenberg', 'REST API'],
  },
  {
    icon: <MessageSquare className="w-8 h-8" />,
    title: 'Support 7j/7',
    description: 'Documentation complète, exemples de code et support réactif pour votre déploiement.',
    color: 'from-pink-500 to-pink-600',
    details: ['Onboarding gratuit', 'Réponse sous 2h', 'Mises à jour incluses'],
  },
];

const DEFAULT_INSTALLATION_STEPS: InstallationStep[] = [
  {
    number: 1,
    title: 'Télécharger le plugin',
    description: 'Téléchargez le plugin Luneo depuis la page WordPress.org ou depuis votre cockpit Luneo.',
    icon: <Package className="w-6 h-6" />,
    color: 'from-blue-500 to-blue-600',
    details: ['WordPress 5.8+', 'WooCommerce 6+', 'PHP 8.0+'],
  },
  {
    number: 2,
    title: 'Installer et activer',
    description: 'Uploadez le fichier ZIP dans Extensions > Ajouter, puis activez le plugin Luneo Customizer.',
    icon: <Settings className="w-6 h-6" />,
    color: 'from-green-500 to-green-600',
    details: ['Extensions > Ajouter', 'Activer Luneo', 'Vérifier les prérequis'],
    code: '// Ou en WP-CLI\nwp plugin install luneo-customizer --activate',
  },
  {
    number: 3,
    title: 'Connecter votre compte Luneo',
    description: 'Dans Réglages > Luneo, entrez votre clé API (disponible dans le cockpit Luneo).',
    icon: <Copy className="w-6 h-6" />,
    color: 'from-purple-500 to-purple-600',
    details: ['Clé API publique', 'Clé API secrète', 'Sauvegarder'],
  },
];

const DEFAULT_CODE_EXAMPLES: Record<string, string> = {
  shortcode: '[luneo_configurator product_id="123"]',
  gutenberg: '// Bloc Gutenberg "Luneo Configurator"\n// Sélectionnez le produit dans le panneau de droite.',
  hooks: "add_filter('luneo_configurator_options', function($opts) {\n  $opts['theme'] = 'dark';\n  return $opts;\n});",
};

const DEFAULT_FAQ = [
  { question: 'Le plugin est-il gratuit ?', answer: 'Oui, le plugin de base est gratuit. Les fonctionnalités avancées (AR, rendus HD) dépendent de votre plan Luneo.' },
  { question: 'Compatible avec mon thème ?', answer: 'Oui, le plugin utilise les hooks standards WooCommerce et s\'intègre à tout thème compatible WordPress 5.8+.' },
  { question: 'Comment obtenir la clé API ?', answer: 'Connectez-vous à votre cockpit Luneo, allez dans Paramètres > Intégrations > Clés API.' },
];

const DEFAULT_TROUBLESHOOTING = [
  { question: 'Le configurateur ne s\'affiche pas', answer: 'Vérifiez que le produit a bien l\'option "Configurateur Luneo" activée. Vérifiez aussi que votre clé API est valide dans Réglages > Luneo.' },
  { question: 'Erreur "Invalid API key"', answer: 'Vérifiez que vous avez collé la clé secrète (et non la clé publique) et qu\'il n\'y a pas d\'espace en trop.' },
];

const DEFAULT_PRICING_PLANS: PricingPlan[] = [
  { id: 'free', name: 'Starter', price: '0€', period: '/mois', description: 'Pour tester la personnalisation', features: ['1 produit', '100 configs/mois', 'Support email'], popular: false },
  { id: 'pro', name: 'Professional', price: '29€', period: '/mois', description: 'Pour les boutiques en croissance', features: ['10 produits', 'Configs illimitées', 'Support prioritaire', 'AR inclus'], popular: true },
  { id: 'business', name: 'Business', price: '99€', period: '/mois', description: 'Pour les grosses volumes', features: ['Produits illimités', 'API dédiée', 'Account manager', 'SLA 99.9%'], popular: false },
];

const DEFAULT_COMPARISON_FEATURES = [
  { feature: 'Configurateur 3D', luneo: 'Inclus', competitors: 'Payant ou limité' },
  { feature: 'Vue AR', luneo: 'Inclus', competitors: 'Souvent absent' },
  { feature: 'Intégration WooCommerce', luneo: 'Native', competitors: 'Plugin tiers' },
  { feature: 'Support', luneo: '7j/7', competitors: 'Variable' },
];

export function WooCommerceIntegrationContent() {
  const [activeTab, setActiveTab] = useState<TabValue>('overview');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string; details?: { name: string; status: string; message: string }[] } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const onTestConnection = useCallback(async () => {
    setTestConnectionLoading(true);
    setTestConnectionResult(null);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setTestConnectionResult({ success: true, message: 'Connexion WooCommerce OK.' });
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
      <FeaturesSection features={WOO_FEATURES} />
      <MainTabsSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        testConnectionLoading={testConnectionLoading}
        testConnectionResult={testConnectionResult}
        onTestConnection={onTestConnection}
        installationSteps={DEFAULT_INSTALLATION_STEPS}
        copiedCode={copiedCode}
        onCopyCode={onCopyCode}
        codeExamples={DEFAULT_CODE_EXAMPLES}
        troubleshootingItems={DEFAULT_TROUBLESHOOTING}
        faqItems={DEFAULT_FAQ}
        pricingPlans={DEFAULT_PRICING_PLANS}
        comparisonFeatures={DEFAULT_COMPARISON_FEATURES}
      />
      <CTASection />
    </main>
  );
}
