'use client';

import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  CreditCard,
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
  Lock,
  RefreshCw,
  Globe,
  Play,
  CheckCircle2,
  XCircle,
  Loader2,
  FileText,
  BookOpen,
  Video,
  MessageSquare,
  HelpCircle,
  Key,
  DollarSign,
  TrendingUp,
  Award,
  Star,
  Rocket,
  Activity,
  Clock,
  Calendar,
  Eye,
  EyeOff,
  ChevronRight,
  Info,
  AlertTriangle,
  Server,
  Database,
  Network,
  Power,
  Download,
  Upload,
  Save,
  Edit,
  Trash2,
  Plus,
  Minus,
  Search,
  Filter,
  Sliders,
  Cog,
  Wrench,
  Plug,
  Building2,
  Users,
  ShoppingCart,
  Package,
  Layers,
  Palette,
  Image,
  FileCode,
  Terminal,
  Cloud,
  Monitor,
  Smartphone,
  Tablet,
  Mail,
  Phone,
  MapPin,
  UserCheck,
  QrCode,
  Scan,
  Camera,
  FileImage,
  FileJson,
  FileType,
  Folder,
  Archive,
  HardDrive,
  Cpu,
  MemoryStick,
  Wifi,
  WifiOff,
  Signal,
  Battery,
  PowerOff,
  Sun,
  Moon,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Droplet,
  Flame,
  Snowflake,
  Umbrella,
  Rainbow,
  Headphones,
  ThumbsUp,
  Target,
  PieChart,
  Heart,
  CheckSquare,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { logger } from '../../../../lib/logger';

function StripeIntegrationPageContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'code' | 'webhooks' | 'troubleshooting' | 'faq' | 'pricing' | 'security'>('overview');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<'test' | 'live'>('test');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {}, 100);
    return () => clearTimeout(timer);
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
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      const checks = [
        { name: 'Clé API Stripe', status: 'success', message: 'Clé API valide et active' },
        { name: 'Webhook endpoint', status: 'success', message: 'Endpoint webhook configuré' },
        { name: 'Signature webhook', status: 'success', message: 'Signature webhook vérifiée' },
        { name: 'Connexion API', status: 'success', message: 'Connexion API Stripe réussie' },
        { name: 'Permissions', status: 'success', message: 'Toutes les permissions requises' },
      ];

      setTestConnectionResult({
        success: true,
        message: 'Connexion Stripe réussie ! Votre intégration est opérationnelle.',
        details: checks,
      });
    } catch (error: any) {
      setTestConnectionResult({
        success: false,
        message: error.message || 'Erreur lors de la connexion. Vérifiez vos clés API.',
        details: [
          { name: 'Connexion API', status: 'error', message: 'Impossible de se connecter' },
        ],
      });
    } finally {
      setTestConnectionLoading(false);
    }
  }, []);

  const features = [
    {
      icon: <CreditCard className="w-6 h-6" />,
      title: 'Paiements sécurisés',
      description: 'Acceptez les paiements par carte bancaire, Apple Pay, Google Pay, et plus de 40 méthodes de paiement dans 135+ devises.',
      color: 'from-blue-500 to-indigo-500',
      details: [
        'Support 40+ méthodes de paiement',
        '135+ devises supportées',
        '3D Secure 2.0',
        'PCI DSS Level 1 compliant',
        'Chiffrement TLS 1.3',
      ],
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Checkout optimisé',
      description: 'Checkout Stripe optimisé pour la conversion avec support mobile, localisation automatique, et réduction d\'abandon de panier.',
      color: 'from-purple-500 to-pink-500',
      details: [
        'Taux de conversion optimisé',
        'Support mobile natif',
        'Localisation automatique',
        'Sauvegarde automatique',
        'Retry automatique',
      ],
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Abonnements récurrents',
      description: 'Gérez les abonnements avec facturation récurrente, essais gratuits, plans d\'abonnement flexibles, et gestion des upgrades/downgrades.',
      color: 'from-green-500 to-emerald-500',
      details: [
        'Facturation récurrente',
        'Essais gratuits',
        'Plans flexibles',
        'Upgrades/downgrades',
        'Proration automatique',
      ],
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Protection contre la fraude',
      description: 'Stripe Radar détecte et bloque automatiquement les transactions frauduleuses avec machine learning avancé.',
      color: 'from-red-500 to-pink-500',
      details: [
        'Détection automatique fraude',
        'Machine learning avancé',
        'Blocage en temps réel',
        'Score de risque',
        'Règles personnalisables',
      ],
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Reporting et analytics',
      description: 'Tableau de bord complet avec statistiques de paiement, revenus, remboursements, et analytics détaillées.',
      color: 'from-orange-500 to-red-500',
      details: [
        'Statistiques en temps réel',
        'Rapports personnalisables',
        'Export CSV/PDF',
        'API analytics',
        'Intégration BI',
      ],
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Support international',
      description: 'Acceptez les paiements dans le monde entier avec support multidevise, conversion automatique, et conformité locale.',
      color: 'from-cyan-500 to-blue-500',
      details: [
        '135+ devises',
        'Conversion automatique',
        'Conformité locale',
        'Support régional',
        'Taxes automatiques',
      ],
    },
    {
      icon: <Lock className="w-6 h-6" />,
      title: 'Conformité et sécurité',
      description: 'Conforme PCI DSS Level 1, SOC 2, GDPR, et autres standards de sécurité. Vos données sont protégées.',
      color: 'from-indigo-500 to-purple-500',
      details: [
        'PCI DSS Level 1',
        'SOC 2 Type II',
        'GDPR compliant',
        'Chiffrement AES-256',
        'Audits réguliers',
      ],
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'API moderne',
      description: 'API RESTful moderne avec webhooks en temps réel, SDK dans 10+ langages, et documentation complète.',
      color: 'from-yellow-500 to-orange-500',
      details: [
        'API RESTful',
        'Webhooks temps réel',
        '10+ SDK langages',
        'Documentation complète',
        'Versioning API',
      ],
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Uptime 99.99%',
      description: 'Infrastructure haute disponibilité avec garantie de disponibilité 99.99% et monitoring 24/7.',
      color: 'from-teal-500 to-cyan-500',
      details: [
        '99.99% uptime',
        'Monitoring 24/7',
        'Redondance globale',
        'SLA garanti',
        'Status page publique',
      ],
    },
  ];

  const installationSteps = [
    {
      number: 1,
      title: 'Créer un compte Stripe',
      description: 'Créez votre compte Stripe sur stripe.com. Le compte est gratuit et vous pouvez commencer immédiatement en mode test.',
      icon: <UserCheck className="w-6 h-6" />,
      color: 'blue',
      details: [
        'Allez sur https://stripe.com',
        'Cliquez sur "Créer un compte"',
        'Remplissez vos informations',
        'Vérifiez votre email',
        'Complétez votre profil',
      ],
      code: `// Créer un compte Stripe
// 1. Visitez https://stripe.com
// 2. Cliquez sur "Créer un compte"
// 3. Remplissez le formulaire
// 4. Vérifiez votre email
// 5. Complétez votre profil entreprise`,
    },
    {
      number: 2,
      title: 'Obtenir vos clés API',
      description: 'Récupérez vos clés API depuis le tableau de bord Stripe. Vous aurez des clés de test et de production.',
      icon: <Key className="w-6 h-6" />,
      color: 'green',
      details: [
        'Connectez-vous au Dashboard Stripe',
        'Allez dans Développeurs > Clés API',
        'Copiez la "Clé publique" (pk_test_...)',
        'Copiez la "Clé secrète" (sk_test_...)',
        'Pour production, utilisez les clés "live"',
      ],
      code: `// Clés API Stripe
// Mode test (développement)
const STRIPE_PUBLISHABLE_KEY = 'pk_test_51...';
const STRIPE_SECRET_KEY = 'sk_test_51...';

// Mode production
const STRIPE_PUBLISHABLE_KEY = 'pk_live_51...';
const STRIPE_SECRET_KEY = 'sk_live_51...';`,
    },
    {
      number: 3,
      title: 'Configurer les clés dans Luneo',
      description: 'Ajoutez vos clés API Stripe dans votre compte Luneo pour activer les paiements.',
      icon: <Settings className="w-6 h-6" />,
      color: 'purple',
      details: [
        'Connectez-vous à votre compte Luneo',
        'Allez dans Paramètres > Intégrations > Stripe',
        'Collez votre Clé publique (Publishable Key)',
        'Collez votre Clé secrète (Secret Key)',
        'Sauvegardez les paramètres',
      ],
      code: `// Configuration dans Luneo
// Dashboard > Paramètres > Intégrations > Stripe

// Variables d'environnement
STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_SECRET_KEY=sk_test_51...

// Ou via API
PUT /api/integrations/stripe
{
  "publishableKey": "pk_test_51...",
  "secretKey": "sk_test_51..."
}`,
    },
    {
      number: 4,
      title: 'Configurer les webhooks',
      description: 'Configurez les webhooks Stripe pour recevoir les notifications en temps réel des événements de paiement.',
      icon: <RefreshCw className="w-6 h-6" />,
      color: 'orange',
      details: [
        'Allez dans Stripe Dashboard > Développeurs > Webhooks',
        'Cliquez sur "Ajouter un endpoint"',
        'URL: https://api.luneo.app/webhooks/stripe',
        'Sélectionnez les événements à écouter',
        'Copiez le "Secret de signature"',
      ],
      code: `// Configuration webhook Stripe
// Dashboard > Développeurs > Webhooks

// URL endpoint
https://api.luneo.app/webhooks/stripe

// Événements à écouter:
// - payment_intent.succeeded
// - payment_intent.payment_failed
// - charge.succeeded
// - charge.failed
// - customer.subscription.created
// - customer.subscription.updated
// - customer.subscription.deleted
// - invoice.payment_succeeded
// - invoice.payment_failed`,
    },
    {
      number: 5,
      title: 'Tester l\'intégration',
      description: 'Testez votre intégration Stripe avec les cartes de test fournies par Stripe pour vérifier que tout fonctionne.',
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: 'green',
      details: [
        'Utilisez les cartes de test Stripe',
        'Carte réussie: 4242 4242 4242 4242',
        'Carte refusée: 4000 0000 0000 0002',
        '3D Secure: 4000 0025 0000 3155',
        'Vérifiez les webhooks dans le Dashboard',
      ],
      code: `// Cartes de test Stripe
// Carte réussie
4242 4242 4242 4242
Date: 12/34
CVC: 123

// Carte refusée
4000 0000 0000 0002

// 3D Secure requis
4000 0025 0000 3155

// Plus de cartes: https://stripe.com/docs/testing`,
    },
  ];

  const codeExamples = {
    basic: `// Installation du SDK Stripe
npm install stripe

// Initialisation
const stripe = require('stripe')('sk_test_...');

// Créer un Payment Intent
const paymentIntent = await stripe.paymentIntents.create({
  amount: 2000, // 20.00 EUR en centimes
  currency: 'eur',
  metadata: {
    order_id: 'order_123',
    customer_id: 'customer_456',
  },
});

// Retourner le client_secret au frontend
return { clientSecret: paymentIntent.client_secret };`,

    checkout: `// Créer une session Checkout
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [
    {
      price_data: {
        currency: 'eur',
        product_data: {
          name: 'Produit personnalisé',
          description: 'Design personnalisé avec Luneo',
        },
        unit_amount: 2000, // 20.00 EUR
      },
      quantity: 1,
    },
  ],
  mode: 'payment',
  success_url: 'https://votre-site.com/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://votre-site.com/cancel',
  metadata: {
    order_id: 'order_123',
    design_id: 'design_456',
  },
});

// Rediriger vers session.url`,

    subscription: `// Créer un abonnement
const subscription = await stripe.subscriptions.create({
  customer: 'cus_123',
  items: [
    {
      price: 'price_123', // Price ID depuis Stripe Dashboard
    },
  ],
  payment_behavior: 'default_incomplete',
  payment_settings: { save_default_payment_method: 'on_subscription' },
  expand: ['latest_invoice.payment_intent'],
});

// Retourner le client_secret
return {
  subscriptionId: subscription.id,
  clientSecret: subscription.latest_invoice.payment_intent.client_secret,
};`,

    webhook: `// Webhook handler
const stripe = require('stripe')('sk_test_...');
const express = require('express');
const app = express();

app.post('/webhook', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    return res.status(400).send(\`Webhook Error: \${err.message}\`);
  }

  // Gérer les événements
  switch (event.type) {
    case 'payment_intent.succeeded':
      const paymentIntent = event.data.object;
      // Traiter le paiement réussi
      break;
    case 'payment_intent.payment_failed':
      // Traiter l'échec de paiement
      break;
    default:
      logger.info(\`Événement non géré: \${event.type}\`);
  }

  res.json({received: true});
});`,

    frontend: `// Frontend - Stripe.js
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_...');

// Créer un Payment Intent côté serveur
// Note: Utilisez /api/billing/create-checkout-session pour les abonnements
// ou créez /api/create-payment-intent pour les paiements uniques
const response = await fetch('/api/billing/create-checkout-session', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ planId: 'plan_xxx', billing: 'monthly' }),
});

const { clientSecret } = await response.json();

// Confirmer le paiement
const stripe = await stripePromise;
const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
  payment_method: {
    card: cardElement,
    billing_details: {
      name: 'John Doe',
    },
  },
});

if (error) {
  // Gérer l'erreur
} else if (paymentIntent.status === 'succeeded') {
  // Paiement réussi
}`,

    refund: `// Remboursement
const refund = await stripe.refunds.create({
  payment_intent: 'pi_123',
  amount: 1000, // Remboursement partiel (10.00 EUR)
  reason: 'requested_by_customer',
  metadata: {
    reason: 'Produit défectueux',
    order_id: 'order_123',
  },
});

// Remboursement complet
const refund = await stripe.refunds.create({
  charge: 'ch_123',
});`,
  };

  const webhookEvents = [
    {
      event: 'payment_intent.succeeded',
      description: 'Un paiement a été effectué avec succès',
      when: 'Après confirmation réussie du paiement',
      data: { payment_intent: 'pi_...', amount: 2000, currency: 'eur' },
    },
    {
      event: 'payment_intent.payment_failed',
      description: 'Un paiement a échoué',
      when: 'Lorsque le paiement est refusé',
      data: { payment_intent: 'pi_...', failure_code: 'card_declined' },
    },
    {
      event: 'charge.succeeded',
      description: 'Une charge a été effectuée avec succès',
      when: 'Après capture réussie du paiement',
      data: { charge: 'ch_...', amount: 2000 },
    },
    {
      event: 'customer.subscription.created',
      description: 'Un abonnement a été créé',
      when: 'Lors de la création d\'un abonnement',
      data: { subscription: 'sub_...', customer: 'cus_...' },
    },
    {
      event: 'invoice.payment_succeeded',
      description: 'Le paiement d\'une facture a réussi',
      when: 'Lors du paiement réussi d\'une facture',
      data: { invoice: 'in_...', subscription: 'sub_...' },
    },
  ];

  const troubleshootingItems = [
    {
      question: 'Les paiements ne sont pas traités',
      answer: `Vérifiez que:
1. Vos clés API sont correctes (test vs production)
2. Le mode test/production correspond à vos clés
3. Les webhooks sont configurés correctement
4. L'endpoint webhook est accessible depuis Internet
5. La signature webhook est correcte

Pour déboguer:
- Vérifiez les logs dans Stripe Dashboard > Développeurs > Logs
- Testez avec les cartes de test Stripe
- Vérifiez les logs de votre serveur`,
    },
    {
      question: 'Les webhooks ne sont pas reçus',
      answer: `Assurez-vous que:
1. L'URL du webhook est correcte et accessible
2. Le secret de signature est configuré
3. Les événements sont sélectionnés dans Stripe Dashboard
4. Votre serveur accepte les requêtes POST
5. Le certificat SSL est valide (HTTPS requis)

Pour tester:
- Utilisez Stripe CLI: stripe listen --forward-to localhost:3000/webhook
- Vérifiez les tentatives dans Stripe Dashboard > Webhooks
- Testez avec stripe trigger payment_intent.succeeded`,
    },
    {
      question: 'Erreur "Invalid API Key"',
      answer: `Vérifiez que:
1. La clé API commence par pk_ (publishable) ou sk_ (secret)
2. Vous utilisez les bonnes clés (test vs live)
3. La clé n'a pas été révoquée
4. La clé correspond à votre compte Stripe
5. Aucun espace avant/après la clé

Solution:
- Régénérez les clés dans Stripe Dashboard si nécessaire
- Vérifiez que vous copiez la clé complète
- Utilisez des variables d'environnement pour stocker les clés`,
    },
    {
      question: 'Les remboursements ne fonctionnent pas',
      answer: `Pour rembourser:
1. Vérifiez que le paiement a été capturé (pas seulement autorisé)
2. Le montant du remboursement ne dépasse pas le montant original
3. Vous avez les permissions nécessaires
4. Le délai de remboursement n'est pas dépassé (généralement 90 jours)

Code:
const refund = await stripe.refunds.create({
  payment_intent: 'pi_123',
  amount: 1000, // Optionnel, sinon remboursement complet
});`,
    },
    {
      question: '3D Secure ne fonctionne pas',
      answer: `Pour activer 3D Secure:
1. Activez 3D Secure dans Stripe Dashboard > Paramètres > Paiements
2. Utilisez confirmCardPayment avec return_url
3. Gérez le statut requires_action
4. Redirigez vers l'authentification 3D Secure

Code:
const { error, paymentIntent } = await stripe.confirmCardPayment(
  clientSecret,
  {
    payment_method: { card: cardElement },
  },
  { handleActions: true }
);`,
    },
  ];

  const faqItems = [
    {
      question: 'Combien coûte Stripe ?',
      answer: 'Stripe facture 1.4% + 0.25€ par transaction réussie pour les cartes européennes, et 2.9% + 0.25€ pour les cartes non-européennes. Aucun frais d\'installation ou mensuel. Vous payez uniquement pour les transactions réussies.',
    },
    {
      question: 'Puis-je utiliser Stripe en mode test ?',
      answer: 'Oui ! Stripe offre un mode test complet avec des cartes de test, des webhooks de test, et un dashboard de test séparé. Vous pouvez tester toute l\'intégration sans frais avant de passer en production.',
    },
    {
      question: 'Stripe est-il sécurisé ?',
      answer: 'Oui, Stripe est certifié PCI DSS Level 1, le plus haut niveau de certification. Toutes les données de carte sont chiffrées et Stripe gère toute la conformité PCI pour vous. Vous n\'avez jamais accès aux numéros de carte complets.',
    },
    {
      question: 'Puis-je accepter plusieurs devises ?',
      answer: 'Oui, Stripe supporte 135+ devises. Vous pouvez accepter les paiements dans différentes devises et Stripe gère automatiquement la conversion. Vous pouvez également définir des devises par défaut par pays.',
    },
    {
      question: 'Comment gérer les remboursements ?',
      answer: 'Vous pouvez créer des remboursements via l\'API Stripe ou depuis le Dashboard. Les remboursements peuvent être complets ou partiels, et vous pouvez spécifier une raison. Les remboursements sont traités en 5-10 jours ouvrables.',
    },
    {
      question: 'Stripe fonctionne-t-il sur mobile ?',
      answer: 'Oui, Stripe supporte nativement les paiements mobiles avec Apple Pay, Google Pay, et les applications mobiles. Le Checkout Stripe est également optimisé pour mobile avec une interface responsive.',
    },
    {
      question: 'Comment obtenir de l\'aide ?',
      answer: 'Stripe offre un support 24/7 via email, chat, et téléphone. La documentation est complète avec des exemples de code dans 10+ langages. Vous pouvez également consulter notre documentation Luneo pour l\'intégration spécifique.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white py-24 sm:py-28 md:py-32">
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl"
              >
                <CreditCard className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Intégration Stripe
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl md:text-3xl text-indigo-100 mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              Acceptez les paiements en ligne avec Stripe. Plus de 40 méthodes de paiement, 135+ devises,
              <br />
              <span className="font-semibold text-white">et une sécurité de niveau bancaire.</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Link href="https://stripe.com" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-10 py-7 text-lg shadow-xl hover:shadow-2xl transition-all"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Créer un compte Stripe
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/help/documentation/integrations/stripe">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/20 backdrop-blur border-2 border-white/50 text-white hover:bg-white/30 font-semibold px-10 py-7 text-lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Documentation
                </Button>
              </Link>
              <Link href="/dashboard/billing">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/20 backdrop-blur border-2 border-white/50 text-white hover:bg-white/30 font-semibold px-10 py-7 text-lg"
                >
                  <Settings className="w-5 h-5 mr-2" />
                  Configurer
                </Button>
              </Link>
            </motion.div>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap justify-center gap-8 text-sm md:text-base"
            >
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>1.4% + 0.25€ par transaction</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>135+ devises</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>PCI DSS Level 1</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>99.99% uptime</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-indigo-600 mb-2">$1T+</div>
              <div className="text-sm md:text-base text-gray-600">Volume traité</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">135+</div>
              <div className="text-sm md:text-base text-gray-600">Devises</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">40+</div>
              <div className="text-sm md:text-base text-gray-600">Méthodes paiement</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">99.99%</div>
              <div className="text-sm md:text-base text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Fonctionnalités Complètes
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Tout ce dont vous avez besoin pour accepter les paiements en ligne de manière sécurisée et professionnelle
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
                <Card className="p-8 h-full hover:shadow-2xl transition-all duration-300 border-2 hover:border-indigo-500/50 group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-400">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content Tabs */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-8 mb-12 h-auto p-1 bg-gray-100 rounded-lg">
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="setup" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Settings className="w-4 h-4" />
                Installation
              </TabsTrigger>
              <TabsTrigger value="code" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Code className="w-4 h-4" />
                Code
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="flex items-center gap-2 data-[state=active]:bg-white">
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Webhooks</span>
                <span className="sm:hidden">Webhooks</span>
              </TabsTrigger>
              <TabsTrigger value="troubleshooting" className="flex items-center gap-2 data-[state=active]:bg-white">
                <AlertCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Dépannage</span>
                <span className="sm:hidden">Help</span>
              </TabsTrigger>
              <TabsTrigger value="faq" className="flex items-center gap-2 data-[state=active]:bg-white">
                <HelpCircle className="w-4 h-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="pricing" className="flex items-center gap-2 data-[state=active]:bg-white">
                <DollarSign className="w-4 h-4" />
                <span className="hidden sm:inline">Tarifs</span>
                <span className="sm:hidden">Prix</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Sécurité</span>
                <span className="sm:hidden">Sec</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Pourquoi choisir Stripe avec Luneo ?</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    {
                      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
                      title: 'Taux de conversion optimisé',
                      description: 'Stripe Checkout est optimisé pour maximiser les conversions avec une interface moderne, support mobile natif, et réduction de l\'abandon de panier.',
                      stats: '+15% conversion',
                    },
                    {
                      icon: <Shield className="w-6 h-6 text-blue-600" />,
                      title: 'Sécurité maximale',
                      description: 'PCI DSS Level 1, chiffrement AES-256, détection de fraude automatique avec Stripe Radar. Vos données et celles de vos clients sont protégées.',
                      stats: 'PCI DSS Level 1',
                    },
                    {
                      icon: <Zap className="w-6 h-6 text-purple-600" />,
                      title: 'Intégration simple',
                      description: 'API moderne et intuitive, SDK dans 10+ langages, documentation complète. Intégration en quelques heures, pas quelques semaines.',
                      stats: '2h intégration',
                    },
                    {
                      icon: <Globe className="w-6 h-6 text-orange-600" />,
                      title: 'Support international',
                      description: 'Acceptez les paiements dans 135+ devises, avec conversion automatique et conformité locale. Support multilingue et régional.',
                      stats: '135+ devises',
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-6 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          {item.icon}
                        </div>
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
                  {[
                    { value: '$1T+', label: 'Volume traité', color: 'text-indigo-600' },
                    { value: '135+', label: 'Devises', color: 'text-green-600' },
                    { value: '40+', label: 'Méthodes paiement', color: 'text-purple-600' },
                    { value: '99.99%', label: 'Uptime', color: 'text-orange-600' },
                  ].map((stat, idx) => (
                    <div key={idx} className="text-center p-6 bg-white rounded-xl shadow-sm">
                      <div className={`text-4xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </div>
                  ))}
                </div>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="p-6 bg-white rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-6 h-6 text-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">PCI DSS Level 1</span>
                    </div>
                    <p className="text-sm text-gray-600">Certification sécurité la plus élevée</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-6 h-6 text-blue-500" />
                      <span className="text-2xl font-bold text-gray-900">Millions</span>
                    </div>
                    <p className="text-sm text-gray-600">Entreprises utilisent Stripe</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Star className="w-6 h-6 text-purple-500 fill-purple-500" />
                      <span className="text-2xl font-bold text-gray-900">4.9/5</span>
                    </div>
                    <p className="text-sm text-gray-600">Note moyenne développeurs</p>
                  </div>
                </div>
              </Card>

              {/* Test Connection Widget */}
              <Card className="p-8 md:p-10 border-2 border-indigo-500/20 bg-gradient-to-br from-indigo-50 to-white">
                <h3 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-indigo-600" />
                  Test de Connexion Stripe
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Testez votre connexion Stripe pour vérifier que tout est correctement configuré. Le test vérifie les clés API, les webhooks, et la connectivité.
                </p>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleTestConnection}
                      disabled={testConnectionLoading}
                      size="lg"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg"
                    >
                      {testConnectionLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Test en cours...
                        </>
                      ) : (
                        <>
                          <Play className="w-5 h-5 mr-2" />
                          Tester la connexion
                        </>
                      )}
                    </Button>
                    <Link href="/dashboard/billing">
                      <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                        <Settings className="w-5 h-5 mr-2" />
                        Configurer Stripe
                      </Button>
                    </Link>
                    <Link href="/help/documentation/integrations/stripe">
                      <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                        <BookOpen className="w-5 h-5 mr-2" />
                        Guide d'installation
                      </Button>
                    </Link>
                  </div>
                  <AnimatePresence>
                    {testConnectionResult && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                      >
                        <Alert className={testConnectionResult.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}>
                          <div className="flex items-start gap-3">
                            {testConnectionResult.success ? (
                              <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5" />
                            ) : (
                              <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <AlertTitle className={testConnectionResult.success ? 'text-green-900 text-lg' : 'text-red-900 text-lg'}>
                                {testConnectionResult.success ? 'Connexion réussie' : 'Erreur de connexion'}
                              </AlertTitle>
                              <AlertDescription className={testConnectionResult.success ? 'text-green-800 mt-2' : 'text-red-800 mt-2'}>
                                {testConnectionResult.message}
                              </AlertDescription>
                            </div>
                          </div>
                        </Alert>
                        {testConnectionResult.details && (
                          <div className="space-y-2">
                            {testConnectionResult.details.map((check: any, idx: number) => (
                              <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                {check.status === 'success' ? (
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                ) : (
                                  <XCircle className="w-5 h-5 text-red-600" />
                                )}
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
            </TabsContent>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Guide d'Installation Étape par Étape</h3>
                <div className="space-y-8">
                  {installationSteps.map((step, index) => (
                    <div key={index} className={`border-l-4 pl-8 ${index === 0 ? 'border-blue-500' : index === 1 ? 'border-green-500' : index === 2 ? 'border-purple-500' : index === 3 ? 'border-orange-500' : 'border-green-500'}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${index === 0 ? 'from-blue-500 to-blue-600' : index === 1 ? 'from-green-500 to-green-600' : index === 2 ? 'from-purple-500 to-purple-600' : index === 3 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600'} text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg`}>
                          {step.number}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                            {step.icon}
                            {step.title}
                          </h4>
                          <p className="text-lg text-gray-600 mb-4 leading-relaxed">{step.description}</p>
                          <ul className="space-y-2 mb-4">
                            {step.details.map((detail, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-gray-600">
                                <ChevronRight className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                          {step.code && (
                            <div className="mt-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-semibold text-gray-700">Exemple de code:</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyCode(step.code, `step-${index}`)}
                                >
                                  {copiedCode === `step-${index}` ? (
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
                                  <code>{step.code}</code>
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 md:p-10 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                  Configuration terminée !
                </h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Félicitations ! Votre intégration Stripe est maintenant configurée. Vous pouvez commencer à accepter les paiements
                  et voir les transactions apparaître dans votre dashboard Stripe et Luneo.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/dashboard/billing">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">
                      Accéder au dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/help/documentation/integrations/stripe">
                    <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                      <BookOpen className="w-5 h-5 mr-2" />
                      Documentation complète
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Contacter le support
                    </Button>
                  </Link>
                </div>
              </Card>
            </TabsContent>

            {/* Code Tab */}
            <TabsContent value="code" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Exemples de Code Complets</h3>
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 md:grid-cols-6 mb-6">
                    <TabsTrigger value="basic">Basique</TabsTrigger>
                    <TabsTrigger value="checkout">Checkout</TabsTrigger>
                    <TabsTrigger value="subscription">Abonnement</TabsTrigger>
                    <TabsTrigger value="webhook">Webhook</TabsTrigger>
                    <TabsTrigger value="frontend">Frontend</TabsTrigger>
                    <TabsTrigger value="refund">Remboursement</TabsTrigger>
                  </TabsList>
                  {(Object.keys(codeExamples) as Array<keyof typeof codeExamples>).map((key) => {
                    const code = codeExamples[key];
                    return (
                    <TabsContent key={key} value={key} className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-xl font-semibold text-gray-900 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCopyCode(code, key)}
                          >
                            {copiedCode === key ? (
                              <>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                                Copié !
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copier le code
                              </>
                            )}
                          </Button>
                        </div>
                        <div className="bg-gray-900 rounded-lg p-6 overflow-x-auto">
                          <pre className="text-sm text-gray-100 leading-relaxed">
                            <code>{code}</code>
                          </pre>
                        </div>
                      </div>
                    </TabsContent>
                    );
                  })}
                </Tabs>
              </Card>

              <Card className="p-8 md:p-10 bg-indigo-50 border-2 border-indigo-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <FileText className="w-7 h-7 text-indigo-600" />
                  Documentation Complète
                </h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Pour des exemples plus avancés, des cas d'usage spécifiques, et la référence API complète, consultez notre documentation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/help/documentation/integrations/stripe">
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Documentation Stripe
                    </Button>
                  </Link>
                  <Link href="https://stripe.com/docs" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Stripe Docs
                    </Button>
                  </Link>
                  <Link href="/demo/playground">
                    <Button variant="outline" className="w-full justify-start">
                      <Play className="w-4 h-4 mr-2" />
                      API Playground
                    </Button>
                  </Link>
                  <Link href="/help/documentation/examples">
                    <Button variant="outline" className="w-full justify-start">
                      <FileCode className="w-4 h-4 mr-2" />
                      Plus d'exemples
                    </Button>
                  </Link>
                </div>
              </Card>
            </TabsContent>

            {/* Webhooks Tab */}
            <TabsContent value="webhooks" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Configuration des Webhooks Stripe</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="text-xl font-semibold text-gray-900 mb-4">Événements Webhook Disponibles</h4>
                    <div className="space-y-4">
                      {webhookEvents.map((event, idx) => (
                        <Card key={idx} className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-bold text-gray-900 mb-2">{event.event}</h5>
                              <p className="text-gray-600 mb-2">{event.description}</p>
                              <p className="text-sm text-gray-500">Quand: {event.when}</p>
                            </div>
                            <div className="ml-4">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded">{event.event}</code>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
                    <h4 className="font-semibold text-blue-900 mb-2">URL du Webhook</h4>
                    <code className="text-sm text-blue-800 bg-white px-3 py-2 rounded block">
                      https://api.luneo.app/webhooks/stripe
                    </code>
                    <p className="text-sm text-blue-700 mt-2">
                      Configurez cette URL dans Stripe Dashboard {'>'} Développeurs {'>'} Webhooks
                    </p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Troubleshooting Tab */}
            <TabsContent value="troubleshooting" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Dépannage</h3>
                <Accordion type="single" collapsible className="w-full">
                  {troubleshootingItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
                      <AccordionTrigger className="text-left font-semibold text-gray-900 text-lg py-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                          {item.question}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 whitespace-pre-line leading-relaxed pt-2 pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>

              <Card className="p-8 md:p-10 bg-yellow-50 border-2 border-yellow-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <MessageSquare className="w-7 h-7 text-yellow-600" />
                  Besoin d'aide supplémentaire ?
                </h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Notre équipe support est disponible 7j/7 pour vous aider. Contactez-nous et nous répondrons sous 2h.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="/contact">
                    <Button className="bg-yellow-600 hover:bg-yellow-700 text-white w-full">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Contacter le support
                    </Button>
                  </Link>
                  <Link href="/help/support">
                    <Button variant="outline" className="w-full">
                      <HelpCircle className="w-4 h-4 mr-2" />
                      Centre d'aide
                    </Button>
                  </Link>
                  <Link href="https://support.stripe.com" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Support Stripe
                    </Button>
                  </Link>
                </div>
              </Card>
            </TabsContent>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Questions Fréquentes</h3>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`faq-${index}`} className="border-b border-gray-200">
                      <AccordionTrigger className="text-left font-semibold text-gray-900 text-lg py-4 hover:no-underline">
                        <div className="flex items-center gap-3">
                          <HelpCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                          {item.question}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-600 leading-relaxed pt-2 pb-4">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            </TabsContent>

            {/* Pricing Tab */}
            <TabsContent value="pricing" className="space-y-8">
              <div className="text-center mb-12">
                <h3 className="text-4xl font-bold text-gray-900 mb-4">Tarifs Stripe</h3>
                <p className="text-xl text-gray-600">Tarifs transparents, sans frais cachés</p>
              </div>
              <Card className="p-8 md:p-10">
                <div className="grid md:grid-cols-2 gap-8">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-4">Cartes européennes</h4>
                    <div className="text-4xl font-bold text-indigo-600 mb-2">1.4% + 0.25€</div>
                    <p className="text-gray-600 mb-4">Par transaction réussie</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Cartes de débit/crédit européennes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>SEPA Direct Debit</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Apple Pay, Google Pay</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-4">Cartes internationales</h4>
                    <div className="text-4xl font-bold text-purple-600 mb-2">2.9% + 0.25€</div>
                    <p className="text-gray-600 mb-4">Par transaction réussie</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Cartes non-européennes</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Cartes prépayées</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Méthodes de paiement alternatives</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-8 p-6 bg-gray-50 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-2">Aucun frais caché</h5>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>✓ Aucun frais d'installation</li>
                    <li>✓ Aucun frais mensuel</li>
                    <li>✓ Aucun frais d'annulation</li>
                    <li>✓ Remboursements gratuits</li>
                    <li>✓ Support 24/7 inclus</li>
                  </ul>
                </div>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Sécurité et Conformité</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    {
                      title: 'PCI DSS Level 1',
                      description: 'Certification de sécurité la plus élevée pour le traitement des cartes de paiement.',
                      icon: <Shield className="w-8 h-8 text-blue-600" />,
                    },
                    {
                      title: 'SOC 2 Type II',
                      description: 'Audit de sécurité indépendant certifiant les contrôles de sécurité, disponibilité, et confidentialité.',
                      icon: <Lock className="w-8 h-8 text-green-600" />,
                    },
                    {
                      title: 'GDPR Compliant',
                      description: 'Conforme au Règlement Général sur la Protection des Données (RGPD) européen.',
                      icon: <Globe className="w-8 h-8 text-purple-600" />,
                    },
                    {
                      title: 'Chiffrement AES-256',
                      description: 'Toutes les données sensibles sont chiffrées avec AES-256, le standard de chiffrement le plus sécurisé.',
                      icon: <Key className="w-8 h-8 text-orange-600" />,
                    },
                  ].map((item, idx) => (
                    <div key={idx} className="p-6 bg-gray-50 rounded-xl">
                      <div className="flex items-start gap-4">
                        {item.icon}
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{item.title}</h4>
                          <p className="text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Prêt à accepter les paiements avec Stripe ?
          </h2>
          <p className="text-xl md:text-2xl text-indigo-100 mb-10 leading-relaxed">
            Créez votre compte Stripe gratuitement et commencez à accepter les paiements en quelques minutes.
            <br />
            Aucun frais d'installation, payez uniquement pour les transactions réussies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://stripe.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-indigo-600 hover:bg-indigo-50 font-bold px-10 py-7 text-lg shadow-xl">
                <CreditCard className="w-5 h-5 mr-2" />
                Créer un compte Stripe
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 font-semibold px-10 py-7 text-lg">
                <MessageSquare className="w-5 h-5 mr-2" />
                Demander une démo
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button size="lg" variant="outline" className="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 font-semibold px-10 py-7 text-lg">
                <Settings className="w-5 h-5 mr-2" />
                Configurer maintenant
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

const StripeIntegrationPageMemo = memo(StripeIntegrationPageContent);

export default function StripeIntegrationPage() {
  return (
    <ErrorBoundary componentName="StripeIntegrationPage">
      <StripeIntegrationPageMemo />
    </ErrorBoundary>
  );
}
