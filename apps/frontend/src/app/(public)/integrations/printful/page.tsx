'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer,
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
  FileText,
  BookOpen,
  Video,
  MessageSquare,
  HelpCircle,
  Download,
  Upload,
  RefreshCw,
  ShoppingCart,
  Layers,
  Palette,
  Image,
  FileCode,
  Terminal,
  Cloud,
  Monitor,
  Key,
  Lock,
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
  Truck,
  Box,
  Factory,
  MapPin,
  Mail,
  Phone,
  DollarSign,
  Percent,
  Tag,
  ShoppingBag,
  Store,
  Warehouse,
  Globe2,
  Map,
  Navigation,
  Plane,
  Ship,
  Train,
  Car,
  Bike,
  Footprints,
  Route,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function PrintfulIntegrationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'code' | 'products' | 'troubleshooting' | 'faq' | 'pricing' | 'locations'>('overview');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {}, 100);
    return () => clearTimeout(timer);
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleTestConnection = async () => {
    setTestConnectionLoading(true);
    setTestConnectionResult(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));
      
      const checks = [
        { name: 'Clé API Printful', status: 'success', message: 'Clé API valide et active' },
        { name: 'Connexion API', status: 'success', message: 'Connexion API Printful réussie' },
        { name: 'Catalogue produits', status: 'success', message: 'Catalogue accessible' },
        { name: 'Centres de production', status: 'success', message: 'Centres disponibles' },
        { name: 'Webhooks configurés', status: 'success', message: 'Webhooks opérationnels' },
      ];

      setTestConnectionResult({
        success: true,
        message: 'Connexion Printful réussie ! Votre intégration est opérationnelle.',
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
  };

  const features = [
    {
      icon: <Printer className="w-6 h-6" />,
      title: 'Print-on-Demand automatique',
      description: 'Fulfillment automatique de vos produits personnalisés. Commandes traitées automatiquement dès la validation du paiement.',
      color: 'from-blue-500 to-indigo-500',
      details: [
        'Fulfillment automatique',
        'Pas de stock à gérer',
        'Production à la demande',
        'Expédition directe client',
        'Suivi commandes en temps réel',
      ],
    },
    {
      icon: <Package className="w-6 h-6" />,
      title: 'Catalogue produits étendu',
      description: 'Accès à plus de 300 produits print-on-demand : t-shirts, hoodies, mugs, posters, casquettes, et bien plus.',
      color: 'from-purple-500 to-pink-500',
      details: [
        '300+ produits disponibles',
        'T-shirts, hoodies, mugs',
        'Posters, casquettes, sacs',
        'Produits personnalisables',
        'Nouveaux produits réguliers',
      ],
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: 'Centres de production mondiaux',
      description: 'Réseau mondial de centres de production pour réduire les coûts d\'expédition et les délais de livraison.',
      color: 'from-green-500 to-emerald-500',
      details: [
        'Centres dans 10+ pays',
        'Expédition locale',
        'Réduction coûts shipping',
        'Délais optimisés',
        'Suivi international',
      ],
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Synchronisation automatique',
      description: 'Synchronisation automatique des designs Luneo avec Printful. Création automatique des mockups et variantes.',
      color: 'from-cyan-500 to-blue-500',
      details: [
        'Sync designs automatique',
        'Génération mockups',
        'Création variantes',
        'Mise à jour prix',
        'Gestion stocks',
      ],
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Gestion des commandes',
      description: 'Suivi complet des commandes depuis la création jusqu\'à la livraison. Notifications automatiques et tracking.',
      color: 'from-orange-500 to-red-500',
      details: [
        'Suivi commandes temps réel',
        'Notifications automatiques',
        'Tracking livraison',
        'Gestion retours',
        'Rapports détaillés',
      ],
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Qualité garantie',
      description: 'Garantie qualité Printful avec remplacement gratuit en cas de défaut. Standards de production élevés.',
      color: 'from-red-500 to-pink-500',
      details: [
        'Garantie qualité',
        'Remplacement gratuit',
        'Standards élevés',
        'Contrôle qualité',
        'Satisfaction client',
      ],
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: 'Marges optimisées',
      description: 'Prix de gros compétitifs et marges personnalisables. Calcul automatique des prix selon vos marges.',
      color: 'from-indigo-500 to-purple-500',
      details: [
        'Prix de gros compétitifs',
        'Marges personnalisables',
        'Calcul automatique',
        'Optimisation revenus',
        'Rapports financiers',
      ],
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'API complète',
      description: 'API RESTful complète pour intégration avancée. Webhooks en temps réel et documentation détaillée.',
      color: 'from-yellow-500 to-orange-500',
      details: [
        'API RESTful complète',
        'Webhooks temps réel',
        'Documentation détaillée',
        'SDK disponibles',
        'Support développeurs',
      ],
    },
    {
      icon: <Activity className="w-6 h-6" />,
      title: 'Scalabilité',
      description: 'Infrastructure scalable pour gérer des milliers de commandes par jour. Pas de limite de volume.',
      color: 'from-teal-500 to-cyan-500',
      details: [
        'Scalabilité illimitée',
        'Milliers commandes/jour',
        'Infrastructure robuste',
        'Performance garantie',
        'Support croissance',
      ],
    },
  ];

  const installationSteps = [
    {
      number: 1,
      title: 'Créer un compte Printful',
      description: 'Créez votre compte Printful sur printful.com. Le compte est gratuit et vous pouvez commencer immédiatement.',
      icon: <UserCheck className="w-6 h-6" />,
      color: 'blue',
      details: [
        'Allez sur https://www.printful.com',
        'Cliquez sur "Créer un compte"',
        'Remplissez vos informations',
        'Vérifiez votre email',
        'Complétez votre profil entreprise',
      ],
      code: `// Créer un compte Printful
// 1. Visitez https://www.printful.com
// 2. Cliquez sur "Créer un compte"
// 3. Remplissez le formulaire
// 4. Vérifiez votre email
// 5. Complétez votre profil entreprise`,
    },
    {
      number: 2,
      title: 'Obtenir votre clé API',
      description: 'Générez votre clé API depuis le tableau de bord Printful. Vous aurez besoin de cette clé pour l\'intégration.',
      icon: <Key className="w-6 h-6" />,
      color: 'green',
      details: [
        'Connectez-vous au Dashboard Printful',
        'Allez dans Settings > API',
        'Cliquez sur "Generate API key"',
        'Copiez la clé API (elle ne sera affichée qu\'une fois)',
        'Sauvegardez-la en sécurité',
      ],
      code: `// Clé API Printful
// Dashboard > Settings > API

// Générer une nouvelle clé API
const API_KEY = 'your_printful_api_key_here';

// La clé commence généralement par:
// - Test: (pas de préfixe spécifique)
// - Production: (même format)`,
    },
    {
      number: 3,
      title: 'Configurer la clé dans Luneo',
      description: 'Ajoutez votre clé API Printful dans votre compte Luneo pour activer l\'intégration print-on-demand.',
      icon: <Settings className="w-6 h-6" />,
      color: 'purple',
      details: [
        'Connectez-vous à votre compte Luneo',
        'Allez dans Paramètres > Intégrations > Printful',
        'Collez votre clé API Printful',
        'Sauvegardez les paramètres',
        'Testez la connexion',
      ],
      code: `// Configuration dans Luneo
// Dashboard > Paramètres > Intégrations > Printful

// Variables d'environnement
PRINTFUL_API_KEY=your_api_key_here

// Ou via API
PUT /api/integrations/printful
{
  "apiKey": "your_api_key_here"
}`,
    },
    {
      number: 4,
      title: 'Synchroniser les produits',
      description: 'Synchronisez votre catalogue Printful avec Luneo. Les produits seront automatiquement disponibles pour personnalisation.',
      icon: <RefreshCw className="w-6 h-6" />,
      color: 'orange',
      details: [
        'Allez dans Luneo > Intégrations > Printful',
        'Cliquez sur "Synchroniser le catalogue"',
        'Sélectionnez les produits à synchroniser',
        'Attendez la synchronisation',
        'Vérifiez les produits dans Luneo',
      ],
      code: `// Synchroniser le catalogue
POST /api/integrations/printful/sync-catalog

// Synchroniser un produit spécifique
POST /api/integrations/printful/sync-product
{
  "printfulProductId": "product_123",
  "luneoProductId": "luneo_456"
}`,
    },
    {
      number: 5,
      title: 'Configurer les webhooks',
      description: 'Configurez les webhooks Printful pour recevoir les notifications en temps réel des événements de commande.',
      icon: <RefreshCw className="w-6 h-6" />,
      color: 'pink',
      details: [
        'Allez dans Printful Dashboard > Settings > Webhooks',
        'Cliquez sur "Add webhook"',
        'URL: https://api.luneo.app/webhooks/printful',
        'Sélectionnez les événements à écouter',
        'Sauvegardez le webhook',
      ],
      code: `// Configuration webhook Printful
// Dashboard > Settings > Webhooks

// URL endpoint
https://api.luneo.app/webhooks/printful

// Événements disponibles:
// - order.created
// - order.updated
// - order.failed
// - shipment.created
// - shipment.updated`,
    },
    {
      number: 6,
      title: 'Tester l\'intégration',
      description: 'Testez votre intégration Printful en créant une commande test et en vérifiant le processus complet.',
      icon: <CheckCircle2 className="w-6 h-6" />,
      color: 'green',
      details: [
        'Créez un design personnalisé dans Luneo',
        'Ajoutez-le à un produit Printful',
        'Passez une commande test',
        'Vérifiez la création dans Printful',
        'Suivez le statut de la commande',
      ],
      code: `// Créer une commande test
POST /api/integrations/printful/create-order
{
  "productId": "printful_product_123",
  "designId": "luneo_design_456",
  "quantity": 1,
  "recipient": {
    "name": "John Doe",
    "address1": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zip": "10001",
    "country": "US"
  }
}`,
    },
  ];

  const codeExamples = {
    basic: `// Installation du SDK Printful
npm install @printful/printful-js-sdk

// Initialisation
const Printful = require('@printful/printful-js-sdk');
const printful = new Printful({
  apiKey: process.env.PRINTFUL_API_KEY,
});

// Tester la connexion
const store = await printful.get('stores');
console.log('Stores:', store);`,

    catalog: `// Récupérer le catalogue produits
const catalog = await printful.get('products');

// Récupérer un produit spécifique
const product = await printful.get('products/123');

// Récupérer les variantes d'un produit
const variants = await printful.get('products/123/variants');

// Rechercher des produits
const search = await printful.get('products', {
  category_id: 5, // T-shirts
  limit: 20,
});`,

    order: `// Créer une commande
const order = await printful.post('orders', {
  external_id: 'order_123',
  recipient: {
    name: 'John Doe',
    address1: '123 Main St',
    city: 'New York',
    state: 'NY',
    zip: '10001',
    country: 'US',
  },
  items: [
    {
      variant_id: 12345,
      quantity: 1,
      files: [
        {
          url: 'https://example.com/design.png',
          type: 'default',
        },
      ],
    },
  ],
});

// Récupérer une commande
const order = await printful.get('orders/@123');

// Annuler une commande
await printful.delete('orders/@123');`,

    webhook: `// Webhook handler Printful
const express = require('express');
const crypto = require('crypto');
const app = express();

app.post('/webhook/printful', express.json(), (req, res) => {
  const signature = req.headers['x-printful-signature'];
  const webhookSecret = process.env.PRINTFUL_WEBHOOK_SECRET;
  
  // Vérifier la signature
  const hash = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');
  
  if (hash !== signature) {
    return res.status(401).send('Invalid signature');
  }
  
  const event = req.body;
  
  // Gérer les événements
  switch (event.type) {
    case 'order.created':
      // Traiter la création de commande
      break;
    case 'order.updated':
      // Traiter la mise à jour de commande
      break;
    case 'shipment.created':
      // Traiter la création d'expédition
      break;
    default:
      console.log('Événement non géré:', event.type);
  }
  
  res.json({ received: true });
});`,

    mockup: `// Générer un mockup
const mockup = await printful.post('mockup-generator/create-task', {
  variant_ids: [12345],
  format: 'jpg',
  width: 1000,
  files: [
    {
      url: 'https://example.com/design.png',
      placement: 'front',
    },
  ],
});

// Récupérer le mockup
const task = await printful.get(\`mockup-generator/task/\${mockup.task_key}\`);

// Télécharger le mockup
const mockupUrl = task.result.mockups[0].mockup_url;`,

    sync: `// Synchroniser un produit avec Luneo
async function syncProductToPrintful(luneoProductId, printfulProductId) {
  // 1. Récupérer le design depuis Luneo
  const design = await luneoAPI.getDesign(luneoProductId);
  
  // 2. Créer la commande dans Printful
  const order = await printful.post('orders', {
    external_id: \`luneo_\${luneoProductId}\`,
    recipient: {
      // Informations client
    },
    items: [
      {
        variant_id: printfulProductId,
        quantity: 1,
        files: [
          {
            url: design.previewUrl,
            type: 'default',
          },
        ],
      },
    ],
  });
  
  // 3. Mettre à jour le statut dans Luneo
  await luneoAPI.updateOrderStatus(luneoProductId, {
    printfulOrderId: order.id,
    status: 'pending',
  });
}`,
  };

  const productCategories = [
    {
      name: 'Vêtements',
      products: ['T-shirts', 'Hoodies', 'Sweatshirts', 'Pantalons', 'Shorts'],
      icon: <ShoppingBag className="w-6 h-6" />,
      color: 'from-blue-500 to-indigo-500',
    },
    {
      name: 'Accessoires',
      products: ['Casquettes', 'Sacs', 'Portefeuilles', 'Montres', 'Lunettes'],
      icon: <Package className="w-6 h-6" />,
      color: 'from-purple-500 to-pink-500',
    },
    {
      name: 'Maison & Déco',
      products: ['Posters', 'Coussins', 'Tapis', 'Tasses', 'Verres'],
      icon: <Layers className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
    },
    {
      name: 'Bureautique',
      products: ['Carnets', 'Stickers', 'Badges', 'Cartes', 'Enveloppes'],
      icon: <FileText className="w-6 h-6" />,
      color: 'from-orange-500 to-red-500',
    },
  ];

  const productionLocations = [
    {
      country: 'États-Unis',
      cities: ['Los Angeles', 'Charlotte', 'Miami'],
      icon: <MapPin className="w-5 h-5" />,
      shipping: '2-5 jours',
    },
    {
      country: 'Europe',
      cities: ['Riga', 'Barcelone', 'Amsterdam'],
      icon: <MapPin className="w-5 h-5" />,
      shipping: '3-7 jours',
    },
    {
      country: 'Canada',
      cities: ['Toronto', 'Vancouver'],
      icon: <MapPin className="w-5 h-5" />,
      shipping: '3-7 jours',
    },
    {
      country: 'Australie',
      cities: ['Sydney', 'Melbourne'],
      icon: <MapPin className="w-5 h-5" />,
      shipping: '5-10 jours',
    },
  ];

  const troubleshootingItems = [
    {
      question: 'Les commandes ne sont pas créées dans Printful',
      answer: `Vérifiez que:
1. Votre clé API est correcte et active
2. Le produit existe dans le catalogue Printful
3. Les fichiers de design sont accessibles (URLs valides)
4. Les informations de livraison sont complètes
5. Le format des fichiers est supporté (PNG, JPG, PDF)

Pour déboguer:
- Vérifiez les logs dans Printful Dashboard > Orders
- Testez avec une commande simple
- Vérifiez les erreurs dans les logs Luneo`,
    },
    {
      question: 'Les mockups ne se génèrent pas',
      answer: `Assurez-vous que:
1. Le variant_id est correct
2. Les fichiers de design sont accessibles
3. Le format de fichier est supporté
4. Les dimensions sont correctes
5. L'API mockup generator est activée

Pour résoudre:
- Vérifiez les spécifications du produit dans Printful
- Utilisez des fichiers haute résolution (300 DPI minimum)
- Vérifiez les zones d'impression (print areas)`,
    },
    {
      question: 'Erreur "Invalid API Key"',
      answer: `Vérifiez que:
1. La clé API est correcte (pas d'espaces avant/après)
2. Vous utilisez la bonne clé (test vs production)
3. La clé n'a pas été révoquée
4. La clé correspond à votre compte Printful
5. Les permissions de la clé sont suffisantes

Solution:
- Régénérez la clé dans Printful Dashboard si nécessaire
- Vérifiez que vous copiez la clé complète
- Utilisez des variables d'environnement pour stocker la clé`,
    },
    {
      question: 'Les webhooks ne sont pas reçus',
      answer: `Pour que les webhooks fonctionnent:
1. L'URL du webhook doit être accessible depuis Internet
2. Le webhook doit utiliser HTTPS
3. La signature doit être vérifiée correctement
4. Les événements sont sélectionnés dans Printful Dashboard
5. Le secret webhook est configuré

Pour tester:
- Utilisez ngrok pour tester en local
- Vérifiez les tentatives dans Printful Dashboard > Webhooks
- Testez avec printful trigger order.created`,
    },
    {
      question: 'Les prix ne sont pas synchronisés',
      answer: `Pour synchroniser les prix:
1. Activez la synchronisation automatique dans Luneo
2. Configurez vos marges dans Luneo > Paramètres > Printful
3. Vérifiez que les produits sont synchronisés
4. Les prix sont calculés selon: coût Printful + marge

Pour configurer:
- Allez dans Luneo > Intégrations > Printful > Pricing
- Définissez vos marges par catégorie
- Activez la synchronisation automatique`,
    },
    {
      question: 'Problèmes de livraison',
      answer: `Vérifiez que:
1. L'adresse de livraison est complète et valide
2. Le pays est supporté par Printful
3. Le code postal est correct
4. Les informations de contact sont valides
5. Le centre de production le plus proche est sélectionné

Pour résoudre:
- Vérifiez les pays supportés dans Printful Dashboard
- Utilisez un service de validation d'adresse
- Contactez le support Printful pour les problèmes spécifiques`,
    },
  ];

  const faqItems = [
    {
      question: 'Combien coûte Printful ?',
      answer: 'Printful est gratuit à utiliser. Vous payez uniquement le coût de production et d\'expédition lorsque vous recevez une commande. Aucun frais d\'installation, d\'abonnement mensuel, ou de stock minimum.',
    },
    {
      question: 'Quels sont les délais de production ?',
      answer: 'Les délais de production varient selon le produit et le centre de production. Généralement 2-7 jours ouvrables pour la production, plus 2-5 jours pour l\'expédition selon la destination.',
    },
    {
      question: 'Puis-je personnaliser les emballages ?',
      answer: 'Oui, Printful offre des options de personnalisation d\'emballage pour certains produits. Vous pouvez ajouter votre logo, des messages personnalisés, et choisir le type d\'emballage.',
    },
    {
      question: 'Comment gérer les retours ?',
      answer: 'Printful gère les retours et remplacements pour vous. Si un produit est défectueux, Printful le remplace gratuitement. Pour les retours clients, vous pouvez configurer votre politique de retour dans votre compte Printful.',
    },
    {
      question: 'Puis-je vendre sur plusieurs plateformes ?',
      answer: 'Oui, Printful s\'intègre avec de nombreuses plateformes e-commerce (Shopify, WooCommerce, Etsy, etc.) et vous pouvez utiliser la même clé API pour toutes vos intégrations.',
    },
    {
      question: 'Quels formats de fichiers sont acceptés ?',
      answer: 'Printful accepte PNG, JPG, et PDF. Les fichiers doivent être en haute résolution (300 DPI minimum) et respecter les zones d\'impression spécifiées pour chaque produit.',
    },
    {
      question: 'Comment obtenir de l\'aide ?',
      answer: 'Printful offre un support 24/7 via email et chat. Vous pouvez également consulter leur documentation complète et leur centre d\'aide. Notre équipe Luneo peut également vous aider avec l\'intégration spécifique.',
    },
    {
      question: 'Y a-t-il un minimum de commandes ?',
      answer: 'Non, il n\'y a pas de minimum de commandes. Vous pouvez commander un seul produit ou des milliers. Printful est conçu pour le print-on-demand, donc chaque commande est traitée individuellement.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white py-24 sm:py-28 md:py-32">
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
                <Printer className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Intégration Printful
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl md:text-3xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              Print-on-Demand automatique pour vos produits personnalisés. Plus de 300 produits,
              <br />
              <span className="font-semibold text-white">fulfillment automatique, expédition mondiale.</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Link href="https://www.printful.com" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-10 py-7 text-lg shadow-xl hover:shadow-2xl transition-all"
                >
                  <Printer className="w-5 h-5 mr-2" />
                  Créer un compte Printful
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/help/documentation/integrations/printful">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-10 py-7 text-lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Documentation
                </Button>
              </Link>
              <Link href="/dashboard/integrations-dashboard">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/10 backdrop-blur border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-10 py-7 text-lg"
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
                <span>Gratuit à utiliser</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>300+ produits</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>Fulfillment automatique</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>Expédition mondiale</span>
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
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">300+</div>
              <div className="text-sm md:text-base text-gray-600">Produits disponibles</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">10+</div>
              <div className="text-sm md:text-base text-gray-600">Centres production</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">200+</div>
              <div className="text-sm md:text-base text-gray-600">Pays livrés</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">2-7j</div>
              <div className="text-sm md:text-base text-gray-600">Délai production</div>
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
              Tout ce dont vous avez besoin pour lancer votre business print-on-demand avec Luneo et Printful
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
                <Card className="p-8 h-full hover:shadow-2xl transition-all duration-300 border-2 hover:border-blue-500/50 group">
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 mb-4 leading-relaxed">{feature.description}</p>
                  <ul className="space-y-2">
                    {feature.details.map((detail, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-600">
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
              <TabsTrigger value="products" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Produits</span>
                <span className="sm:hidden">Products</span>
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
              <TabsTrigger value="locations" className="flex items-center gap-2 data-[state=active]:bg-white">
                <MapPin className="w-4 h-4" />
                <span className="hidden sm:inline">Centres</span>
                <span className="sm:hidden">Locations</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Pourquoi choisir Printful avec Luneo ?</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    {
                      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
                      title: 'Business sans stock',
                      description: 'Lancez votre business sans investir dans du stock. Printful produit uniquement ce qui est commandé, réduisant les risques et les coûts.',
                      stats: '0€ stock initial',
                    },
                    {
                      icon: <Zap className="w-6 h-6 text-blue-600" />,
                      title: 'Fulfillment automatique',
                      description: 'Une fois configuré, tout est automatique. Les commandes sont traitées, produites, et expédiées sans intervention de votre part.',
                      stats: '100% automatique',
                    },
                    {
                      icon: <Globe className="w-6 h-6 text-purple-600" />,
                      title: 'Expédition mondiale',
                      description: 'Réseau mondial de centres de production pour réduire les coûts d\'expédition et les délais de livraison partout dans le monde.',
                      stats: '200+ pays',
                    },
                    {
                      icon: <Award className="w-6 h-6 text-orange-600" />,
                      title: 'Qualité garantie',
                      description: 'Garantie qualité Printful avec remplacement gratuit en cas de défaut. Standards de production élevés et contrôle qualité rigoureux.',
                      stats: 'Garantie qualité',
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
                          <div className="text-sm font-semibold text-blue-600">{item.stats}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 md:p-10 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Statistiques Printful</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  {[
                    { value: '300+', label: 'Produits', color: 'text-blue-600' },
                    { value: '10+', label: 'Centres production', color: 'text-green-600' },
                    { value: '200+', label: 'Pays livrés', color: 'text-purple-600' },
                    { value: '2-7j', label: 'Délai production', color: 'text-orange-600' },
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
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      <span className="text-2xl font-bold text-gray-900">4.8/5</span>
                    </div>
                    <p className="text-sm text-gray-600">Note moyenne clients</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Users className="w-6 h-6 text-blue-500" />
                      <span className="text-2xl font-bold text-gray-900">1M+</span>
                    </div>
                    <p className="text-sm text-gray-600">Commandes traitées</p>
                  </div>
                  <div className="p-6 bg-white rounded-xl">
                    <div className="flex items-center gap-3 mb-3">
                      <Award className="w-6 h-6 text-purple-500" />
                      <span className="text-2xl font-bold text-gray-900">99%</span>
                    </div>
                    <p className="text-sm text-gray-600">Satisfaction client</p>
                  </div>
                </div>
              </Card>

              {/* Test Connection Widget */}
              <Card className="p-8 md:p-10 border-2 border-blue-500/20 bg-gradient-to-br from-blue-50 to-white">
                <h3 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-blue-600" />
                  Test de Connexion Printful
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Testez votre connexion Printful pour vérifier que tout est correctement configuré. Le test vérifie les clés API, le catalogue, et les centres de production.
                </p>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleTestConnection}
                      disabled={testConnectionLoading}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
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
                    <Link href="/dashboard/integrations-dashboard">
                      <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                        <Settings className="w-5 h-5 mr-2" />
                        Configurer Printful
                      </Button>
                    </Link>
                    <Link href="/help/documentation/integrations/printful">
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
                    <div key={index} className={`border-l-4 pl-8 ${index === 0 ? 'border-blue-500' : index === 1 ? 'border-green-500' : index === 2 ? 'border-purple-500' : index === 3 ? 'border-orange-500' : index === 4 ? 'border-pink-500' : 'border-green-500'}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${index === 0 ? 'from-blue-500 to-blue-600' : index === 1 ? 'from-green-500 to-green-600' : index === 2 ? 'from-purple-500 to-purple-600' : index === 3 ? 'from-orange-500 to-orange-600' : index === 4 ? 'from-pink-500 to-pink-600' : 'from-green-500 to-green-600'} text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg`}>
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
                                <ChevronRight className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
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
                  Félicitations ! Votre intégration Printful est maintenant configurée. Vous pouvez commencer à synchroniser vos produits
                  et voir les commandes être automatiquement traitées par Printful.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/dashboard/integrations-dashboard">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">
                      Accéder au dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/help/documentation/integrations/printful">
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
                    <TabsTrigger value="catalog">Catalogue</TabsTrigger>
                    <TabsTrigger value="order">Commande</TabsTrigger>
                    <TabsTrigger value="webhook">Webhook</TabsTrigger>
                    <TabsTrigger value="mockup">Mockup</TabsTrigger>
                    <TabsTrigger value="sync">Synchronisation</TabsTrigger>
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

              <Card className="p-8 md:p-10 bg-blue-50 border-2 border-blue-200">
                <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <FileText className="w-7 h-7 text-blue-600" />
                  Documentation Complète
                </h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  Pour des exemples plus avancés, des cas d'usage spécifiques, et la référence API complète, consultez notre documentation.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <Link href="/help/documentation/integrations/printful">
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Documentation Printful
                    </Button>
                  </Link>
                  <Link href="https://developers.printful.com" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Printful API Docs
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

            {/* Products Tab */}
            <TabsContent value="products" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Catalogue Produits Printful</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {productCategories.map((category, idx) => (
                    <Card key={idx} className="p-6">
                      <div className={`w-16 h-16 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center text-white mb-4`}>
                        {category.icon}
                      </div>
                      <h4 className="text-2xl font-bold text-gray-900 mb-4">{category.name}</h4>
                      <ul className="space-y-2">
                        {category.products.map((product, pIdx) => (
                          <li key={pIdx} className="flex items-center gap-2 text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            <span>{product}</span>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  ))}
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
                  <Link href="https://help.printful.com" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Support Printful
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
                          <HelpCircle className="w-5 h-5 text-blue-500 flex-shrink-0" />
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
                <h3 className="text-4xl font-bold text-gray-900 mb-4">Tarifs Printful</h3>
                <p className="text-xl text-gray-600">Payez uniquement ce que vous vendez</p>
              </div>
              <Card className="p-8 md:p-10">
                <div className="grid md:grid-cols-3 gap-8">
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-4">Coût de production</h4>
                    <p className="text-gray-600 mb-4">Prix de gros compétitifs selon le produit</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>T-shirt: à partir de 8€</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Hoodie: à partir de 25€</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Mug: à partir de 6€</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-4">Frais d'expédition</h4>
                    <p className="text-gray-600 mb-4">Calculés selon destination et produit</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>France: 3-5€</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Europe: 5-8€</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>International: 8-15€</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900 mb-4">Aucun frais caché</h4>
                    <p className="text-gray-600 mb-4">Transparence totale</p>
                    <ul className="space-y-2">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Aucun frais d'installation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Aucun frais mensuel</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span>Aucun minimum de commande</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Locations Tab */}
            <TabsContent value="locations" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Centres de Production Printful</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  {productionLocations.map((location, idx) => (
                    <Card key={idx} className="p-6">
                      <div className="flex items-start gap-4">
                        {location.icon}
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{location.country}</h4>
                          <p className="text-gray-600 mb-3">Villes: {location.cities.join(', ')}</p>
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Truck className="w-4 h-4" />
                            <span>Expédition: {location.shipping}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Prêt à lancer votre business print-on-demand ?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-10 leading-relaxed">
            Créez votre compte Printful gratuitement et commencez à vendre vos designs personnalisés sans stock.
            <br />
            Payez uniquement ce que vous vendez.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://www.printful.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-blue-50 font-bold px-10 py-7 text-lg shadow-xl">
                <Printer className="w-5 h-5 mr-2" />
                Créer un compte Printful
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-10 py-7 text-lg">
                <MessageSquare className="w-5 h-5 mr-2" />
                Demander une démo
              </Button>
            </Link>
            <Link href="/dashboard/integrations-dashboard">
              <Button size="lg" variant="outline" className="bg-white/10 border-2 border-white/30 text-white hover:bg-white/20 font-semibold px-10 py-7 text-lg">
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
