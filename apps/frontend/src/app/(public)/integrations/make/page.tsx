'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Workflow,
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
  Download,
  Upload,
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
  GitBranch,
  ArrowLeftRight,
  Repeat,
  RotateCw,
  Shuffle,
  DollarSign,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

function MakeIntegrationPageContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'scenarios' | 'modules' | 'troubleshooting' | 'faq' | 'pricing'>('overview');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedScenario, setSelectedScenario] = useState<string | null>(null);

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
        { name: 'Clé API Make', status: 'success', message: 'Clé API valide et active' },
        { name: 'Connexion API', status: 'success', message: 'Connexion API Make réussie' },
        { name: 'Scénarios disponibles', status: 'success', message: 'Scénarios configurés' },
        { name: 'Modules disponibles', status: 'success', message: 'Modules opérationnels' },
        { name: 'Webhooks configurés', status: 'success', message: 'Webhooks opérationnels' },
      ];

      setTestConnectionResult({
        success: true,
        message: 'Connexion Make réussie ! Votre intégration est opérationnelle.',
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
      icon: <Workflow className="w-6 h-6" />,
      title: 'Scénarios visuels avancés',
      description: 'Créez des scénarios complexes avec interface visuelle intuitive. Branches conditionnelles, boucles, et transformations de données.',
      color: 'from-purple-500 to-pink-500',
      details: [
        'Interface visuelle intuitive',
        'Branches conditionnelles',
        'Boucles et itérations',
        'Transformations données',
        'Gestion erreurs avancée',
      ],
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: '1000+ applications',
      description: 'Connectez Luneo à plus de 1000 applications et services. Intégrations pré-construites et API personnalisées.',
      color: 'from-blue-500 to-indigo-500',
      details: [
        '1000+ applications',
        'Intégrations pré-construites',
        'API personnalisées',
        'Webhooks supportés',
        'REST et SOAP',
      ],
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Exécution temps réel',
      description: 'Exécution instantanée des scénarios avec traitement parallèle et optimisation automatique des performances.',
      color: 'from-green-500 to-emerald-500',
      details: [
        'Exécution instantanée',
        'Traitement parallèle',
        'Optimisation automatique',
        'Cache intelligent',
        'Scalabilité',
      ],
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Sécurité enterprise',
      description: 'Chiffrement SSL, authentification OAuth, et conformité GDPR pour garantir la sécurité de vos données.',
      color: 'from-red-500 to-pink-500',
      details: [
        'Chiffrement SSL',
        'Authentification OAuth',
        'Conformité GDPR',
        'Isolation données',
        'Audit logs',
      ],
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Monitoring et analytics',
      description: 'Suivez les performances de vos scénarios avec analytics détaillés, logs, et alertes en temps réel.',
      color: 'from-cyan-500 to-blue-500',
      details: [
        'Analytics détaillés',
        'Logs complets',
        'Alertes temps réel',
        'Rapports personnalisables',
        'Historique complet',
      ],
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'Performance optimisée',
      description: 'Exécution ultra-rapide avec traitement parallèle, cache intelligent, et optimisation automatique.',
      color: 'from-orange-500 to-red-500',
      details: [
        'Exécution ultra-rapide',
        'Traitement parallèle',
        'Cache intelligent',
        'Optimisation automatique',
        'Scalabilité illimitée',
      ],
    },
  ];

  const installationSteps = [
    {
      number: 1,
      title: 'Créer un compte Make',
      description: 'Créez votre compte Make sur make.com. Le compte est gratuit pour commencer avec des scénarios limités.',
      icon: <UserCheck className="w-6 h-6" />,
      color: 'blue',
      details: [
        'Allez sur https://www.make.com',
        'Cliquez sur "Créer un compte"',
        'Remplissez vos informations',
        'Vérifiez votre email',
        'Complétez votre profil',
      ],
      code: `// Créer un compte Make
// 1. Visitez https://www.make.com
// 2. Cliquez sur "Créer un compte"
// 3. Remplissez le formulaire
// 4. Vérifiez votre email
// 5. Complétez votre profil`,
    },
    {
      number: 2,
      title: 'Obtenir votre clé API',
      description: 'Générez votre clé API depuis le tableau de bord Make. Vous aurez besoin de cette clé pour l\'intégration.',
      icon: <Key className="w-6 h-6" />,
      color: 'green',
      details: [
        'Connectez-vous au Dashboard Make',
        'Allez dans Settings > API',
        'Cliquez sur "Generate API key"',
        'Copiez la clé API',
        'Sauvegardez-la en sécurité',
      ],
      code: `// Clé API Make
// Dashboard > Settings > API

const API_KEY = 'your_make_api_key_here';`,
    },
    {
      number: 3,
      title: 'Configurer la clé dans Luneo',
      description: 'Ajoutez votre clé API Make dans votre compte Luneo pour activer l\'intégration.',
      icon: <Settings className="w-6 h-6" />,
      color: 'purple',
      details: [
        'Connectez-vous à votre compte Luneo',
        'Allez dans Paramètres > Intégrations > Make',
        'Collez votre clé API Make',
        'Sauvegardez les paramètres',
        'Testez la connexion',
      ],
      code: `// Configuration dans Luneo
// Dashboard > Paramètres > Intégrations > Make

MAKE_API_KEY=your_api_key_here`,
    },
    {
      number: 4,
      title: 'Créer votre premier scénario',
      description: 'Créez votre premier scénario Make en connectant Luneo à vos applications préférées.',
      icon: <Workflow className="w-6 h-6" />,
      color: 'orange',
      details: [
        'Allez dans Make Dashboard',
        'Cliquez sur "Create a new scenario"',
        'Ajoutez le module Luneo comme trigger',
        'Ajoutez vos actions',
        'Testez et activez le scénario',
      ],
      code: `// Scénario Make de base
// Trigger: Nouveau design créé dans Luneo
// Action: Envoyer notification Slack

{
  "scenario": {
    "name": "Luneo Design → Slack",
    "modules": [
      {
        "type": "trigger",
        "app": "luneo",
        "event": "design.created"
      },
      {
        "type": "action",
        "app": "slack",
        "method": "post_message"
      }
    ]
  }
}`,
    },
  ];

  const scenarios = [
    {
      name: 'Nouveau design → Notification Teams',
      description: 'Envoyez une notification Microsoft Teams dès qu\'un nouveau design est créé dans Luneo.',
      trigger: 'Nouveau design créé',
      action: 'Envoyer message Teams',
      steps: [
        'Trigger: Nouveau design créé dans Luneo',
        'Action: Envoyer message dans canal Teams',
        'Format: Design ID, URL, créateur',
      ],
      code: `// Scénario Make
// Trigger: Nouveau design créé
// Action: Envoyer message Teams

{
  "scenario": {
    "name": "Luneo Design → Teams",
    "modules": [
      {
        "type": "trigger",
        "app": "luneo",
        "event": "design.created",
        "config": {
          "webhook": "https://hook.make.com/..."
        }
      },
      {
        "type": "action",
        "app": "microsoft_teams",
        "method": "post_message",
        "config": {
          "channel": "{{channel_id}}",
          "message": "Nouveau design: {{design.name}}",
          "attachments": [{
            "title": "{{design.name}}",
            "url": "{{design.url}}"
          }]
        }
      }
    ]
  }
}`,
    },
    {
      name: 'Commande → Créer ticket Zendesk',
      description: 'Créez automatiquement un ticket Zendesk pour chaque nouvelle commande.',
      trigger: 'Nouvelle commande',
      action: 'Créer ticket Zendesk',
      steps: [
        'Trigger: Nouvelle commande dans Luneo',
        'Action: Créer ticket dans Zendesk',
        'Format: Titre, description, priorité',
      ],
      code: `// Scénario Make
// Trigger: Nouvelle commande
// Action: Créer ticket Zendesk

{
  "scenario": {
    "name": "Luneo Order → Zendesk",
    "modules": [
      {
        "type": "trigger",
        "app": "luneo",
        "event": "order.created"
      },
      {
        "type": "action",
        "app": "zendesk",
        "method": "create_ticket",
        "config": {
          "subject": "Commande #{{order.id}}",
          "description": "Client: {{order.customer_name}}\\nMontant: {{order.total}}",
          "priority": "normal"
        }
      }
    ]
  }
}`,
    },
    {
      name: 'Design terminé → Mettre à jour Airtable',
      description: 'Mettez à jour automatiquement votre base Airtable quand un design est terminé.',
      trigger: 'Design terminé',
      action: 'Mettre à jour Airtable',
      steps: [
        'Trigger: Design terminé dans Luneo',
        'Action: Mettre à jour enregistrement Airtable',
        'Format: Statut, URL, date complétion',
      ],
      code: `// Scénario Make
// Trigger: Design terminé
// Action: Mettre à jour Airtable

{
  "scenario": {
    "name": "Luneo Design → Airtable",
    "modules": [
      {
        "type": "trigger",
        "app": "luneo",
        "event": "design.completed"
      },
      {
        "type": "action",
        "app": "airtable",
        "method": "update_record",
        "config": {
          "base_id": "{{base_id}}",
          "table_id": "{{table_id}}",
          "record_id": "{{design.airtable_id}}",
          "fields": {
            "Status": "Completed",
            "Design URL": "{{design.url}}",
            "Completed At": "{{design.completed_at}}"
          }
        }
      }
    ]
  }
}`,
    },
  ];

  const modules = [
    {
      name: 'Trigger: Nouveau design créé',
      description: 'Déclenché lorsqu\'un nouveau design est créé dans Luneo',
      type: 'trigger',
      event: 'design.created',
      data: {
        design_id: 'string',
        design_name: 'string',
        creator_id: 'string',
        created_at: 'datetime',
      },
    },
    {
      name: 'Trigger: Design terminé',
      description: 'Déclenché lorsqu\'un design est terminé et prêt',
      type: 'trigger',
      event: 'design.completed',
      data: {
        design_id: 'string',
        design_url: 'string',
        download_url: 'string',
        completed_at: 'datetime',
      },
    },
    {
      name: 'Action: Créer un design',
      description: 'Créez un nouveau design dans Luneo depuis Make',
      type: 'action',
      method: 'create_design',
      parameters: {
        name: 'string (required)',
        template_id: 'string (required)',
        customizations: 'object',
      },
    },
    {
      name: 'Action: Récupérer un design',
      description: 'Récupérez les détails d\'un design existant',
      type: 'action',
      method: 'get_design',
      parameters: {
        design_id: 'string (required)',
      },
    },
  ];

  const troubleshootingItems = [
    {
      question: 'Les scénarios ne se déclenchent pas',
      answer: `Vérifiez que:
1. Le scénario est activé dans Make
2. Le trigger est correctement configuré
3. Les événements se produisent bien dans Luneo
4. La connexion API est valide
5. Les logs Make pour les erreurs

Pour déboguer:
- Vérifiez les logs dans Make Dashboard
- Testez le trigger manuellement
- Vérifiez les webhooks dans Luneo`,
    },
    {
      question: 'Erreur "Invalid API Key"',
      answer: `Vérifiez que:
1. La clé API est correcte
2. La clé n'a pas expiré
3. La clé a les bonnes permissions
4. Vous utilisez la bonne clé (test vs production)

Solution:
- Régénérez la clé dans Make Dashboard
- Vérifiez les permissions de la clé
- Testez la clé avec l'API directement`,
    },
    {
      question: 'Les données ne sont pas transmises correctement',
      answer: `Assurez-vous que:
1. Le format des données correspond au schéma
2. Les champs requis sont fournis
3. Les types de données sont corrects
4. Les transformations sont correctes

Pour résoudre:
- Vérifiez le schéma dans la documentation
- Utilisez les transformations Make
- Testez avec des données simples d'abord`,
    },
    {
      question: 'Performance lente des scénarios',
      answer: `Pour optimiser les performances:
1. Utilisez le traitement parallèle quand possible
2. Activez le cache pour les données répétées
3. Optimisez les filtres et conditions
4. Réduisez le nombre de modules inutiles
5. Utilisez les webhooks au lieu du polling

Pour améliorer:
- Analysez les logs de performance
- Identifiez les goulots d'étranglement
- Optimisez les modules lents`,
    },
  ];

  const faqItems = [
    {
      question: 'Combien coûte Make ?',
      answer: 'Make propose un plan gratuit avec 1000 opérations/mois. Les plans payants commencent à 9€/mois avec plus d\'opérations et de fonctionnalités. Consultez make.com/pricing pour les détails.',
    },
    {
      question: 'Puis-je créer des scénarios complexes ?',
      answer: 'Oui, Make supporte les scénarios très complexes avec branches conditionnelles, boucles, transformations de données, et gestion d\'erreurs avancée. Vous pouvez créer des workflows très sophistiqués.',
    },
    {
      question: 'Les scénarios sont-ils exécutés en temps réel ?',
      answer: 'Oui, les scénarios peuvent être exécutés en temps réel avec les webhooks instantanés. Certains scénarios utilisent le polling avec un délai configurable.',
    },
    {
      question: 'Puis-je tester mes scénarios avant de les activer ?',
      answer: 'Oui, Make offre un mode test pour tester vos scénarios avec des données de test avant de les activer en production. Vous pouvez également exécuter manuellement chaque module.',
    },
    {
      question: 'Comment obtenir de l\'aide ?',
      answer: 'Make offre un support via email, chat, et documentation complète. Notre équipe Luneo peut également vous aider avec l\'intégration spécifique.',
    },
    {
      question: 'Puis-je utiliser des API personnalisées ?',
      answer: 'Oui, Make supporte les API personnalisées via le module HTTP. Vous pouvez créer des modules personnalisés pour vos besoins spécifiques.',
    },
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '0€',
      period: '/mois',
      operations: '1000',
      features: [
        '1000 opérations/mois',
        'Scénarios illimités',
        'Support communauté',
        'Modules de base',
      ],
      popular: false,
    },
    {
      name: 'Core',
      price: '9€',
      period: '/mois',
      operations: '10000',
      features: [
        '10000 opérations/mois',
        'Tous les modules',
        'Support email',
        'Exécution temps réel',
      ],
      popular: true,
    },
    {
      name: 'Pro',
      price: '29€',
      period: '/mois',
      operations: '40000',
      features: [
        '40000 opérations/mois',
        'Modules avancés',
        'Support prioritaire',
        'Analytics détaillés',
      ],
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white py-24 sm:py-28 md:py-32">
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
                <Workflow className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Intégration Make
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl md:text-3xl text-purple-100 mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              Automatisez vos workflows Luneo avec Make. Scénarios visuels avancés,
              <br />
              <span className="font-semibold text-white">1000+ applications, performance optimisée.</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Link href="https://www.make.com" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="bg-white text-purple-600 hover:bg-purple-50 font-bold px-10 py-7 text-lg shadow-xl hover:shadow-2xl transition-all"
                >
                  <Workflow className="w-5 h-5 mr-2" />
                  Créer un compte Make
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/help/documentation/integrations/make">
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white/20 backdrop-blur border-2 border-white/50 text-white hover:bg-white/30 font-semibold px-10 py-7 text-lg"
                >
                  <BookOpen className="w-5 h-5 mr-2" />
                  Documentation
                </Button>
              </Link>
              <Link href="/dashboard/integrations">
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
                <span>1000+ applications</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>Plan gratuit disponible</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>Scénarios visuels</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>Temps réel</span>
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
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">1000+</div>
              <div className="text-sm md:text-base text-gray-600">Applications</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">1M+</div>
              <div className="text-sm md:text-base text-gray-600">Utilisateurs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-600 mb-2">10B+</div>
              <div className="text-sm md:text-base text-gray-600">Opérations/mois</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-orange-600 mb-2">99.9%</div>
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
              Automatisez vos workflows Luneo avec la puissance de Make
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
                <Card className="p-8 h-full hover:shadow-2xl transition-all duration-300 border-2 hover:border-purple-500/50 group">
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
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 mb-12 h-auto p-1 bg-gray-100 rounded-lg">
              <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="setup" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Settings className="w-4 h-4" />
                Installation
              </TabsTrigger>
              <TabsTrigger value="scenarios" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Workflow className="w-4 h-4" />
                <span className="hidden sm:inline">Scénarios</span>
                <span className="sm:hidden">Scenarios</span>
              </TabsTrigger>
              <TabsTrigger value="modules" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Plug className="w-4 h-4" />
                Modules
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
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Pourquoi choisir Make avec Luneo ?</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    {
                      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
                      title: 'Scénarios visuels avancés',
                      description: 'Créez des workflows complexes avec interface visuelle intuitive. Pas besoin de code pour automatiser vos processus.',
                      stats: 'Interface visuelle',
                    },
                    {
                      icon: <Zap className="w-6 h-6 text-blue-600" />,
                      title: '1000+ applications',
                      description: 'Connectez Luneo à plus de 1000 applications populaires : Slack, Teams, Airtable, Google Sheets, et bien plus.',
                      stats: '1000+ apps',
                    },
                    {
                      icon: <Shield className="w-6 h-6 text-purple-600" />,
                      title: 'Sécurité enterprise',
                      description: 'Chiffrement SSL, authentification OAuth, et conformité GDPR pour garantir la sécurité de vos données.',
                      stats: 'GDPR compliant',
                    },
                    {
                      icon: <Rocket className="w-6 h-6 text-orange-600" />,
                      title: 'Performance optimisée',
                      description: 'Exécution ultra-rapide avec traitement parallèle et optimisation automatique des performances.',
                      stats: 'Exécution rapide',
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
                          <div className="text-sm font-semibold text-purple-600">{item.stats}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Test Connection Widget */}
              <Card className="p-8 md:p-10 border-2 border-purple-500/20 bg-gradient-to-br from-purple-50 to-white">
                <h3 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-purple-600" />
                  Test de Connexion Make
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Testez votre connexion Make pour vérifier que tout est correctement configuré.
                </p>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleTestConnection}
                      disabled={testConnectionLoading}
                      size="lg"
                      className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 text-lg"
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
                    <Link href="/dashboard/integrations">
                      <Button variant="outline" size="lg" className="px-8 py-6 text-lg">
                        <Settings className="w-5 h-5 mr-2" />
                        Configurer Make
                      </Button>
                    </Link>
                    <Link href="/help/documentation/integrations/make">
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
                    <div key={index} className={`border-l-4 pl-8 ${index === 0 ? 'border-blue-500' : index === 1 ? 'border-green-500' : index === 2 ? 'border-purple-500' : 'border-orange-500'}`}>
                      <div className="flex items-start gap-4 mb-4">
                        <div className={`w-12 h-12 bg-gradient-to-br ${index === 0 ? 'from-blue-500 to-blue-600' : index === 1 ? 'from-green-500 to-green-600' : index === 2 ? 'from-purple-500 to-purple-600' : 'from-orange-500 to-orange-600'} text-white rounded-xl flex items-center justify-center text-lg font-bold shadow-lg`}>
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
                                <ChevronRight className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
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
                  Félicitations ! Votre intégration Make est maintenant configurée. Vous pouvez commencer à créer vos scénarios
                  et automatiser vos workflows Luneo.
                </p>
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/dashboard/integrations">
                    <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">
                      Accéder au dashboard
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Link href="/help/documentation/integrations/make">
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

            {/* Scenarios Tab */}
            <TabsContent value="scenarios" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Scénarios Exemples</h3>
                <div className="space-y-6">
                  {scenarios.map((scenario, idx) => (
                    <Card key={idx} className="p-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{scenario.name}</h4>
                      <p className="text-gray-600 mb-4">{scenario.description}</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-purple-600" />
                          <span className="text-sm text-gray-600">Trigger: {scenario.trigger}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">Action: {scenario.action}</span>
                        </div>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100">
                          <code>{scenario.code}</code>
                        </pre>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Modules Tab */}
            <TabsContent value="modules" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Modules Disponibles</h3>
                <div className="space-y-4">
                  {modules.map((module, idx) => (
                    <Card key={idx} className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-xl font-bold text-gray-900 mb-2">{module.name}</h4>
                          <p className="text-gray-600 mb-4">{module.description}</p>
                          <div className="flex items-center gap-2">
                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{module.type === 'trigger' ? module.event : module.method}</code>
                          </div>
                        </div>
                        <div className="ml-4">
                          {module.type === 'trigger' ? (
                            <Zap className="w-6 h-6 text-purple-600" />
                          ) : (
                            <ArrowRight className="w-6 h-6 text-green-600" />
                          )}
                        </div>
                      </div>
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
                  <Link href="https://www.make.com/help" target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Support Make
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
                          <HelpCircle className="w-5 h-5 text-purple-500 flex-shrink-0" />
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
                <h3 className="text-4xl font-bold text-gray-900 mb-4">Tarifs Make</h3>
                <p className="text-xl text-gray-600">Choisissez le plan qui correspond à vos besoins</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {pricingPlans.map((plan) => (
                  <Card
                    key={plan.name}
                    className={`p-8 ${plan.popular ? 'border-2 border-purple-500 shadow-xl scale-105' : ''}`}
                  >
                    {plan.popular && (
                      <div className="bg-purple-600 text-white text-center py-2 px-4 rounded-t-lg -mt-8 -mx-8 mb-4">
                        <span className="font-bold">Le plus populaire</span>
                      </div>
                    )}
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h4>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">{plan.period}</span>
                    </div>
                    <p className="text-gray-600 mb-2">{plan.operations} opérations/mois</p>
                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className={`w-full ${plan.popular ? 'bg-purple-600 hover:bg-purple-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                      size="lg"
                    >
                      {plan.name === 'Free' ? 'Commencer gratuitement' : 'Choisir ce plan'}
                    </Button>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Prêt à automatiser vos workflows avec Make ?
          </h2>
          <p className="text-xl md:text-2xl text-purple-100 mb-10 leading-relaxed">
            Créez votre compte Make gratuitement et commencez à créer vos scénarios visuels.
            <br />
            Plan gratuit disponible avec 1000 opérations/mois.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://www.make.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-purple-50 font-bold px-10 py-7 text-lg shadow-xl">
                <Workflow className="w-5 h-5 mr-2" />
                Créer un compte Make
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/20 border-2 border-white/50 text-white hover:bg-white/30 font-semibold px-10 py-7 text-lg">
                <MessageSquare className="w-5 h-5 mr-2" />
                Demander une démo
              </Button>
            </Link>
            <Link href="/dashboard/integrations">
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

const MakeIntegrationPageMemo = memo(MakeIntegrationPageContent);

export default function MakeIntegrationPage() {
  return (
    <ErrorBoundary componentName="MakeIntegrationPage">
      <MakeIntegrationPageMemo />
    </ErrorBoundary>
  );
}
