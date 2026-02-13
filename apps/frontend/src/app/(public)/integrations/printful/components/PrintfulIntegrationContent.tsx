'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import {
  Printer,
  Package,
  Globe,
  Zap,
  BarChart3,
  Shield,
  TrendingUp,
  Activity,
  Rocket,
  UserCheck,
  Key,
  Settings,
  RefreshCw,
  CheckCircle2,
  ShoppingBag,
  Layers,
  FileText,
  MapPin,
} from 'lucide-react';
import { HeroSection } from './HeroSection';
import { StatsSection } from './StatsSection';
import { FeaturesSection } from './FeaturesSection';
import { PrintfulTabsSection, type PrintfulTabValue } from './PrintfulTabsSection';
import { CTASection } from './CTASection';
import type { FeatureItem } from './FeaturesSection';
import type { InstallationStep } from './SetupTab';
import { endpoints } from '@/lib/api/client';
import { getErrorDisplayMessage } from '@/lib/hooks/useErrorToast';

function PrintfulIntegrationContentInner() {
  const [activeTab, setActiveTab] = useState<PrintfulTabValue>('overview');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string; details?: { name: string; status: string; message: string }[] } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {}, 100);
    return () => clearTimeout(t);
  }, []);

  const handleCopyCode = useCallback((code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  const handleTestConnection = useCallback(async () => {
    setTestConnectionLoading(true);
    setTestConnectionResult(null);
    try {
      const res = await endpoints.integrations.test('printful', {});
      const data = res as { success?: boolean; message?: string };
      setTestConnectionResult({
        success: data?.success !== false,
        message: data?.message ?? 'Connexion Printful réussie ! Votre intégration est opérationnelle.',
        details: [
          { name: 'Clé API Printful', status: 'success', message: 'Clé API valide' },
          { name: 'Connexion API', status: 'success', message: 'Connexion réussie' },
        ],
      });
    } catch (error: unknown) {
      setTestConnectionResult({
        success: false,
        message: getErrorDisplayMessage(error),
        details: [{ name: 'Connexion API', status: 'error', message: 'Impossible de se connecter' }],
      });
    } finally {
      setTestConnectionLoading(false);
    }
  }, []);

  const features = useMemo<FeatureItem[]>(
    () => [
      { icon: <Printer className="w-6 h-6" />, title: 'Print-on-Demand automatique', description: 'Fulfillment automatique. Commandes traitées dès validation paiement.', color: 'from-blue-500 to-indigo-500', details: ['Fulfillment auto', 'Pas de stock', 'Expédition directe client'] },
      { icon: <Package className="w-6 h-6" />, title: 'Catalogue 300+ produits', description: 'T-shirts, hoodies, mugs, posters, casquettes, etc.', color: 'from-purple-500 to-pink-500', details: ['300+ produits', 'Nouveaux produits réguliers'] },
      { icon: <Globe className="w-6 h-6" />, title: 'Centres mondiaux', description: 'Réseau mondial pour réduire coûts et délais.', color: 'from-green-500 to-emerald-500', details: ['10+ pays', 'Expédition locale'] },
      { icon: <Zap className="w-6 h-6" />, title: 'Sync automatique', description: 'Designs Luneo synchronisés avec Printful. Mockups et variantes.', color: 'from-cyan-500 to-blue-500', details: ['Sync designs', 'Génération mockups'] },
      { icon: <BarChart3 className="w-6 h-6" />, title: 'Gestion commandes', description: 'Suivi de la création à la livraison.', color: 'from-orange-500 to-red-500', details: ['Suivi temps réel', 'Tracking livraison'] },
      { icon: <Shield className="w-6 h-6" />, title: 'Qualité garantie', description: 'Garantie Printful, remplacement gratuit si défaut.', color: 'from-red-500 to-pink-500', details: ['Standards élevés', 'Contrôle qualité'] },
      { icon: <TrendingUp className="w-6 h-6" />, title: 'Marges optimisées', description: 'Prix de gros compétitifs, marges personnalisables.', color: 'from-indigo-500 to-purple-500', details: ['Calcul automatique', 'Rapports financiers'] },
      { icon: <Rocket className="w-6 h-6" />, title: 'API complète', description: 'API RESTful, webhooks temps réel.', color: 'from-yellow-500 to-orange-500', details: ['Documentation', 'SDK disponibles'] },
      { icon: <Activity className="w-6 h-6" />, title: 'Scalabilité', description: 'Milliers de commandes/jour, pas de limite.', color: 'from-teal-500 to-cyan-500', details: ['Infrastructure robuste', 'Support croissance'] },
    ],
    []
  );

  const installationSteps = useMemo<InstallationStep[]>(
    () => [
      { number: 1, title: 'Créer un compte Printful', description: 'Créez votre compte sur printful.com (gratuit).', icon: <UserCheck className="w-6 h-6" />, color: 'blue', details: ['Allez sur printful.com', 'Créer un compte', 'Vérifiez email', 'Profil entreprise'], code: '// 1. Visitez https://www.printful.com\n// 2. Créer un compte' },
      { number: 2, title: 'Obtenir la clé API', description: 'Générez votre clé API dans le Dashboard Printful.', icon: <Key className="w-6 h-6" />, color: 'green', details: ['Dashboard > Settings > API', 'Generate API key', 'Copiez la clé'], code: 'PRINTFUL_API_KEY=your_key' },
      { number: 3, title: 'Configurer dans Luneo', description: 'Ajoutez la clé dans Luneo pour activer l\'intégration.', icon: <Settings className="w-6 h-6" />, color: 'purple', details: ['Luneo > Paramètres > Intégrations > Printful', 'Collez la clé', 'Sauvegardez'], code: 'PUT /api/integrations/printful\n{ "apiKey": "..." }' },
      { number: 4, title: 'Synchroniser les produits', description: 'Sync catalogue Printful avec Luneo.', icon: <RefreshCw className="w-6 h-6" />, color: 'orange', details: ['Luneo > Intégrations > Printful', 'Synchroniser le catalogue', 'Sélectionnez les produits'], code: 'POST /api/integrations/printful/sync-catalog' },
      { number: 5, title: 'Configurer les webhooks', description: 'Webhooks Printful pour notifications temps réel.', icon: <CheckCircle2 className="w-6 h-6" />, color: 'pink', details: ['Printful Dashboard > Webhooks', 'URL: https://api.luneo.app/webhooks/printful'], code: '// order.created, order.updated, shipment.created' },
      { number: 6, title: "Tester l'intégration", description: 'Créez une commande test et vérifiez le processus.', icon: <CheckCircle2 className="w-6 h-6" />, color: 'green', details: ['Design dans Luneo', 'Commande test', 'Vérifiez dans Printful'], code: 'POST /api/integrations/printful/create-order' },
    ],
    []
  );

  const codeExamples = useMemo(
    () => ({
      basic: 'const printful = new Printful({ apiKey: process.env.PRINTFUL_API_KEY });\nconst store = await printful.get("stores");',
      catalog: 'const catalog = await printful.get("products");\nconst product = await printful.get("products/123");',
      order: 'const order = await printful.post("orders", { external_id: "order_123", recipient: {...}, items: [...] });',
      webhook: 'app.post("/webhook/printful", (req, res) => { const event = req.body; /* order.created, etc. */ });',
      mockup: 'const mockup = await printful.post("mockup-generator/create-task", { variant_ids: [12345], files: [...] });',
      sync: 'async function syncProductToPrintful(luneoId, printfulId) { const design = await luneoAPI.getDesign(luneoId); await printful.post("orders", {...}); }',
    }),
    []
  );

  const productCategories = useMemo(
    () => [
      { name: 'Vêtements', products: ['T-shirts', 'Hoodies', 'Sweatshirts', 'Pantalons', 'Shorts'], icon: <ShoppingBag className="w-6 h-6" />, color: 'from-blue-500 to-indigo-500' },
      { name: 'Accessoires', products: ['Casquettes', 'Sacs', 'Portefeuilles', 'Montres', 'Lunettes'], icon: <Package className="w-6 h-6" />, color: 'from-purple-500 to-pink-500' },
      { name: 'Maison & Déco', products: ['Posters', 'Coussins', 'Tapis', 'Tasses', 'Verres'], icon: <Layers className="w-6 h-6" />, color: 'from-green-500 to-emerald-500' },
      { name: 'Bureautique', products: ['Carnets', 'Stickers', 'Badges', 'Cartes', 'Enveloppes'], icon: <FileText className="w-6 h-6" />, color: 'from-orange-500 to-red-500' },
    ],
    []
  );

  const productionLocations = useMemo(
    () => [
      { country: 'États-Unis', cities: ['Los Angeles', 'Charlotte', 'Miami'], icon: <MapPin className="w-5 h-5" />, shipping: '2-5 jours' },
      { country: 'Europe', cities: ['Riga', 'Barcelone', 'Amsterdam'], icon: <MapPin className="w-5 h-5" />, shipping: '3-7 jours' },
      { country: 'Canada', cities: ['Toronto', 'Vancouver'], icon: <MapPin className="w-5 h-5" />, shipping: '3-7 jours' },
      { country: 'Australie', cities: ['Sydney', 'Melbourne'], icon: <MapPin className="w-5 h-5" />, shipping: '5-10 jours' },
    ],
    []
  );

  const troubleshootingItems = useMemo(
    () => [
      { question: 'Les commandes ne sont pas créées dans Printful', answer: 'Vérifiez: clé API correcte, produit dans le catalogue, fichiers accessibles (URLs), infos livraison complètes, format supporté (PNG, JPG, PDF).' },
      { question: 'Les mockups ne se génèrent pas', answer: 'Vérifiez variant_id, fichiers accessibles, format supporté, dimensions, API mockup activée. Fichiers 300 DPI minimum.' },
      { question: 'Erreur "Invalid API Key"', answer: 'Clé correcte (pas d\'espaces), bonne clé (test vs prod), pas révoquée, permissions suffisantes. Régénérez si besoin.' },
      { question: 'Webhooks non reçus', answer: 'URL accessible en HTTPS, signature vérifiée, événements sélectionnés dans Dashboard, secret configuré. Test: ngrok en local.' },
      { question: 'Prix non synchronisés', answer: 'Activez sync auto dans Luneo, configurez marges Luneo > Printful > Pricing, produits synchronisés.' },
    ],
    []
  );

  const faqItems = useMemo(
    () => [
      { question: 'Combien coûte Printful ?', answer: 'Gratuit. Vous payez uniquement production + expédition à chaque commande. Pas de frais mensuel ni minimum.' },
      { question: 'Délais de production ?', answer: 'En général 2-7 jours ouvrables production + 2-5 jours expédition selon destination.' },
      { question: 'Emballages personnalisables ?', answer: 'Oui, options de personnalisation (logo, messages) pour certains produits.' },
      { question: 'Retours ?', answer: 'Printful gère retours et remplacements. Défaut = remplacement gratuit.' },
      { question: 'Plusieurs plateformes ?', answer: 'Oui, même clé API pour Shopify, WooCommerce, Etsy, etc.' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      <HeroSection />
      <StatsSection />
      <FeaturesSection features={features} />
      <PrintfulTabsSection
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        testConnectionLoading={testConnectionLoading}
        testConnectionResult={testConnectionResult}
        onTestConnection={handleTestConnection}
        installationSteps={installationSteps}
        copiedCode={copiedCode}
        onCopyCode={handleCopyCode}
        codeExamples={codeExamples}
        productCategories={productCategories}
        troubleshootingItems={troubleshootingItems}
        faqItems={faqItems}
        productionLocations={productionLocations}
      />
      <CTASection />
    </div>
  );
}

export const PrintfulIntegrationContent = memo(PrintfulIntegrationContentInner);
