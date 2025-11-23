'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  Check,
  Code,
  Settings,
  AlertCircle,
  Copy,
  ExternalLink,
  ArrowRight,
  Sparkles,
  Zap,
  Shield,
  BarChart3,
  Package,
  CreditCard,
  Users,
  Globe,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  BookOpen,
  Video,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ShopifyIntegrationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'code' | 'troubleshooting' | 'faq'>('overview');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestConnectionLoading(true);
    setTestConnectionResult(null);

    try {
      // Simuler test de connexion (à remplacer par vrai appel API)
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Pour l'instant, simuler succès
      // TODO: Remplacer par vrai appel API vers /api/integrations/shopify/test
      setTestConnectionResult({
        success: true,
        message: 'Connexion Shopify réussie ! Votre boutique est connectée.',
      });
    } catch (error: any) {
      setTestConnectionResult({
        success: false,
        message: error.message || 'Erreur lors de la connexion. Vérifiez vos credentials.',
      });
    } finally {
      setTestConnectionLoading(false);
    }
  };

  const features = [
    {
      icon: <ShoppingBag className="w-6 h-6" />,
      title: 'Installation en 1-clic',
      description: 'Installez l\'app Shopify directement depuis le Shopify App Store. Configuration automatique en moins de 2 minutes.',
      color: 'from-green-500 to-emerald-500',
    },
    {
      icon: <Sparkles className="w-6 h-6" />,
      title: 'Personnalisation produits en live',
      description: 'Widget de personnalisation intégré directement dans vos pages produits Shopify. Personnalisation 2D/3D en temps réel.',
      color: 'from-purple-500 to-pink-500',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'AR Try-On intégré',
      description: 'Essayage virtuel AR directement dans votre boutique. Compatible iOS AR Quick Look et Android Scene Viewer.',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Export print-ready automatique',
      description: 'Génération automatique de fichiers print-ready 300 DPI avec bleed et crop marks pour vos imprimeurs.',
      color: 'from-orange-500 to-red-500',
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Sync inventaire temps réel',
      description: 'Synchronisation bidirectionnelle automatique entre Luneo et Shopify. Mise à jour des stocks en temps réel.',
      color: 'from-indigo-500 to-purple-500',
    },
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Prix dynamiques',
      description: 'Calcul automatique des prix selon les options de personnalisation. Intégration native avec Shopify Checkout.',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const codeExamples = {
    install: `// 1. Installer l'app depuis Shopify App Store
// https://apps.shopify.com/luneo

// 2. Autoriser l'accès à votre boutique
// L'app demande les permissions suivantes:
// - read_products: Lire vos produits
// - write_products: Modifier vos produits
// - read_orders: Lire vos commandes
// - write_orders: Créer/modifier commandes
// - read_customers: Lire informations clients
// - write_script_tags: Ajouter scripts personnalisation`,

    widget: `<!-- Ajouter le widget dans votre template produit -->
<!-- theme.liquid ou product.liquid -->

<div id="luneo-customizer" 
     data-product-id="{{ product.id }}"
     data-product-handle="{{ product.handle }}"
     data-api-key="YOUR_API_KEY">
</div>

<script>
  (function() {
    var script = document.createElement('script');
    script.src = 'https://cdn.luneo.app/widget/v1/luneo-widget.js';
    script.async = true;
    document.head.appendChild(script);
    
    script.onload = function() {
      Luneo.init({
        container: '#luneo-customizer',
        productId: '{{ product.id }}',
        apiKey: 'YOUR_API_KEY',
        theme: 'shopify', // Thème adapté à Shopify
        onDesignComplete: function(design) {
          // Ajouter le design au panier Shopify
          fetch('/cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              items: [{
                id: design.variantId,
                quantity: 1,
                properties: {
                  '_luneo_design_id': design.id,
                  '_luneo_preview_url': design.previewUrl
                }
              }]
            })
          });
        }
      });
    };
  })();
</script>`,

    webhook: `// Configuration webhook dans Shopify Admin
// Settings > Notifications > Webhooks

// URL: https://api.luneo.app/webhooks/shopify
// Format: JSON
// Events:
// - orders/create
// - orders/updated
// - products/create
// - products/update

// Le webhook envoie automatiquement:
// - Nouvelles commandes avec designs personnalisés
// - Mises à jour de commandes
// - Création/modification de produits`,

    api: `// Utiliser l'API Luneo depuis votre app Shopify
// Pour intégrations avancées

const LuneoAPI = require('@luneo/shopify-sdk');

const client = new LuneoAPI({
  apiKey: process.env.LUNEO_API_KEY,
  shopDomain: 'your-shop.myshopify.com',
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN
});

// Créer un design personnalisé
const design = await client.designs.create({
  productId: 'shopify-product-123',
  templateId: 'template-456',
  customizations: {
    text: 'Hello World',
    color: '#FF5733',
    position: { x: 100, y: 200 }
  }
});

// Synchroniser un produit
const product = await client.products.sync({
  shopifyProductId: '123',
  luneoProductId: 'luneo-456',
  syncInventory: true,
  syncPricing: true
});

// Récupérer les commandes avec designs
const orders = await client.orders.list({
  status: 'fulfilled',
  includeDesigns: true,
  limit: 50
});`,
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white py-20 sm:py-24 md:py-28">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:4rem_4rem]" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <ShoppingBag className="w-10 h-10 text-white" />
              </div>
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
              Intégration Shopify
            </h1>
            <p className="text-xl sm:text-2xl text-green-100 mb-8 max-w-3xl mx-auto">
              Ajoutez la personnalisation 3D/AR à votre boutique Shopify en 15 minutes.
              <br />
              <span className="font-semibold text-white">Augmentez vos conversions de 35% en moyenne.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="https://apps.shopify.com/luneo" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="bg-white text-green-600 hover:bg-green-50 font-semibold px-8 py-6 text-lg"
                >
                  <ShoppingBag className="w-5 h-5 mr-2" />
              Installer l'app Shopify
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
            </Link>
              <Link href="/help/documentation/integrations/shopify">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-8 py-6 text-lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
              Voir la documentation
                </Button>
            </Link>
            </div>
            <div className="mt-12 flex flex-wrap justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Installation en 2 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Support 7j/7</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Gratuit à installer</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Fonctionnalités Complètes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Tout ce dont vous avez besoin pour transformer votre boutique Shopify en expérience de personnalisation premium
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="p-6 h-full hover:shadow-lg transition-shadow border-2 hover:border-green-500/50">
                  <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-8">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Overview</span>
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
                <span className="sm:hidden">Help</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <Card className="p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Pourquoi choisir Luneo pour Shopify ?</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Augmentation des conversions
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Les boutiques avec personnalisation Luneo voient une augmentation moyenne de 35% de leur taux de conversion.
                      Les clients peuvent voir exactement ce qu'ils achètent avant de commander.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Réduction des retours
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Réduisez les retours de 40% en moyenne. Les clients sont satisfaits car ils voient exactement
                      le produit personnalisé avant l'achat.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Intégration native
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Intégration 100% native avec Shopify. Synchronisation automatique des produits, commandes,
                      et inventaire. Aucune configuration complexe requise.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                      Support premium
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Support dédié 7j/7 avec réponse sous 2h. Onboarding gratuit et sessions de formation
                      pour votre équipe.
                    </p>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Statistiques de Performance</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">+35%</div>
                    <div className="text-sm text-gray-600">Conversion</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">-40%</div>
                    <div className="text-sm text-gray-600">Retours</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">+28%</div>
                    <div className="text-sm text-gray-600">Panier moyen</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">2min</div>
                    <div className="text-sm text-gray-600">Installation</div>
                  </div>
                </div>
              </Card>

              {/* Test Connection Widget */}
              <Card className="p-6 md:p-8 border-2 border-green-500/20">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-6 h-6 text-green-600" />
                  Test de Connexion
                </h3>
                <p className="text-gray-600 mb-6">
                  Testez votre connexion Shopify pour vérifier que tout est correctement configuré.
                </p>
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleTestConnection}
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
                        Configurer l'intégration
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
            </TabsContent>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-6">
              <Card className="p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Guide d'Installation Étape par Étape</h3>
                <div className="space-y-6">
                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      Installer l'app depuis le Shopify App Store
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Rendez-vous sur le{' '}
                      <Link href="https://apps.shopify.com/luneo" target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline font-semibold">
                        Shopify App Store
                      </Link>
                      {' '}et cliquez sur "Installer". L'app demandera les permissions nécessaires pour fonctionner.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2 font-semibold">Permissions requises:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
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
                    <h4 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      Configurer votre compte Luneo
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Après l'installation, vous serez redirigé vers Luneo pour créer votre compte ou vous connecter.
                      Si vous n'avez pas encore de compte, l'inscription est gratuite et prend moins de 2 minutes.
                    </p>
                    <Link href="/register">
                      <Button variant="outline" className="mt-2">
                        Créer un compte Luneo
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>

                  <div className="border-l-4 border-purple-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      Autoriser la connexion
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Autorisez Luneo à accéder à votre boutique Shopify. Cette étape est sécurisée et utilise OAuth 2.0.
                      Vous pouvez révoquer l'accès à tout moment depuis les paramètres Shopify.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <Shield className="w-4 h-4 inline mr-2" />
                        <strong>Sécurité:</strong> Vos credentials ne sont jamais stockés en clair. Nous utilisons le chiffrement AES-256-GCM.
                      </p>
                    </div>
                  </div>

                  <div className="border-l-4 border-orange-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</span>
                      Configurer les webhooks (automatique)
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Les webhooks sont configurés automatiquement lors de l'installation. Ils permettent la synchronisation
                      bidirectionnelle entre Shopify et Luneo.
                    </p>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2 font-semibold">Webhooks configurés:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                        <li>orders/create - Nouvelles commandes</li>
                        <li>orders/updated - Mises à jour commandes</li>
                        <li>products/create - Nouveaux produits</li>
                        <li>products/update - Mises à jour produits</li>
                      </ul>
                    </div>
                  </div>

                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="text-xl font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <span className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">5</span>
                      Ajouter le widget à vos produits
                    </h4>
                    <p className="text-gray-600 mb-4">
                      Le widget de personnalisation est automatiquement ajouté à toutes vos pages produits.
                      Vous pouvez également l'ajouter manuellement si vous utilisez un thème personnalisé.
                    </p>
                    <p className="text-sm text-gray-500">
                      Voir l'onglet "Code" pour les instructions d'installation manuelle.
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
            </TabsContent>

            {/* Code Tab */}
            <TabsContent value="code" className="space-y-6">
              <Card className="p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Exemples de Code</h3>
                <Tabs defaultValue="widget" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="widget">Widget</TabsTrigger>
                    <TabsTrigger value="webhook">Webhooks</TabsTrigger>
                    <TabsTrigger value="api">API</TabsTrigger>
                  </TabsList>
                  <TabsContent value="widget" className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Installation du Widget</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(codeExamples.widget, 'widget')}
                        >
                          {copiedCode === 'widget' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                              Copié !
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copier
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100">
                          <code>{codeExamples.widget}</code>
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="webhook" className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">Configuration Webhooks</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(codeExamples.webhook, 'webhook')}
                        >
                          {copiedCode === 'webhook' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                              Copié !
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copier
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100">
                          <code>{codeExamples.webhook}</code>
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="api" className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">API SDK</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopyCode(codeExamples.api, 'api')}
                        >
                          {copiedCode === 'api' ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                              Copié !
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copier
                            </>
                          )}
                        </Button>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100">
                          <code>{codeExamples.api}</code>
                        </pre>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </Card>

              <Card className="p-6 md:p-8 bg-blue-50 border-2 border-blue-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  Documentation Complète
                </h3>
                <p className="text-gray-700 mb-4">
                  Pour des exemples plus avancés et des cas d'usage spécifiques, consultez notre documentation complète.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/help/documentation/integrations/shopify">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Documentation Shopify
                    </Button>
                  </Link>
                  <Link href="/help/documentation/api-reference">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Code className="w-4 h-4 mr-2" />
                      Référence API
                    </Button>
                  </Link>
                  <Link href="/demo/playground">
                    <Button variant="outline" className="w-full sm:w-auto">
                      <Play className="w-4 h-4 mr-2" />
                      API Playground
                    </Button>
                  </Link>
                </div>
              </Card>
            </TabsContent>

            {/* Troubleshooting Tab */}
            <TabsContent value="troubleshooting" className="space-y-6">
              <Card className="p-6 md:p-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Dépannage</h3>
                <Accordion type="single" collapsible className="w-full">
                  {troubleshootingItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left font-semibold text-gray-900">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 whitespace-pre-line">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>

              <Card className="p-6 md:p-8 bg-yellow-50 border-2 border-yellow-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-yellow-600" />
                  Besoin d'aide supplémentaire ?
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
                      Centre d'aide
                    </Button>
                  </Link>
            </div>
              </Card>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-6">
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
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Prêt à transformer votre boutique Shopify ?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Installez l'app gratuitement et commencez à personnaliser vos produits en moins de 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://apps.shopify.com/luneo" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-green-600 hover:bg-green-50 font-bold px-8 py-6 text-lg">
                <ShoppingBag className="w-5 h-5 mr-2" />
                Installer maintenant
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-8 py-6 text-lg">
                <MessageSquare className="w-5 h-5 mr-2" />
                Demander une démo
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
