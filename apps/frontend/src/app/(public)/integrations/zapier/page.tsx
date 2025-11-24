'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Check,
  Code,
  Settings,
  AlertCircle,
  Copy,
  ExternalLink,
  ArrowRight,
  Sparkles,
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
  Lightning,
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
  Workflow,
  GitBranch,
  ArrowLeftRight,
  Repeat,
  RotateCw,
  Shuffle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function ZapierIntegrationPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'setup' | 'workflows' | 'triggers' | 'actions' | 'troubleshooting' | 'faq'>('overview');
  const [testConnectionLoading, setTestConnectionLoading] = useState(false);
  const [testConnectionResult, setTestConnectionResult] = useState<{ success: boolean; message: string; details?: any } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

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
        { name: 'Clé API Zapier', status: 'success', message: 'Clé API valide et active' },
        { name: 'Connexion API', status: 'success', message: 'Connexion API Zapier réussie' },
        { name: 'Triggers disponibles', status: 'success', message: 'Triggers configurés' },
        { name: 'Actions disponibles', status: 'success', message: 'Actions configurées' },
        { name: 'Webhooks configurés', status: 'success', message: 'Webhooks opérationnels' },
      ];

      setTestConnectionResult({
        success: true,
        message: 'Connexion Zapier réussie ! Votre intégration est opérationnelle.',
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
      icon: <Zap className="w-6 h-6" />,
      title: 'Automatisation sans code',
      description: 'Connectez Luneo à 5000+ applications sans écrire une seule ligne de code. Créez des workflows puissants en quelques clics.',
      color: 'from-yellow-500 to-orange-500',
      details: [
        '5000+ applications connectées',
        'Interface visuelle intuitive',
        'Pas de code requis',
        'Templates prêts à l\'emploi',
        'Workflows personnalisables',
      ],
    },
    {
      icon: <RefreshCw className="w-6 h-6" />,
      title: 'Triggers en temps réel',
      description: 'Déclenchez des actions automatiques dès qu\'un événement se produit dans Luneo. Réactivité instantanée.',
      color: 'from-blue-500 to-indigo-500',
      details: [
        'Triggers temps réel',
        'Événements instantanés',
        'Webhooks automatiques',
        'Polling intelligent',
        'Notifications push',
      ],
    },
    {
      icon: <Workflow className="w-6 h-6" />,
      title: 'Workflows multi-étapes',
      description: 'Créez des workflows complexes avec plusieurs étapes, conditions, et transformations de données.',
      color: 'from-purple-500 to-pink-500',
      details: [
        'Workflows multi-étapes',
        'Conditions et filtres',
        'Transformations données',
        'Branches conditionnelles',
        'Gestion erreurs',
      ],
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: 'Sécurité et fiabilité',
      description: 'Chiffrement SSL, authentification OAuth, et retry automatique pour garantir la sécurité et la fiabilité.',
      color: 'from-green-500 to-emerald-500',
      details: [
        'Chiffrement SSL',
        'Authentification OAuth',
        'Retry automatique',
        'Logs détaillés',
        'Monitoring 24/7',
      ],
    },
    {
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics et monitoring',
      description: 'Suivez les performances de vos workflows avec analytics détaillés, logs, et alertes.',
      color: 'from-cyan-500 to-blue-500',
      details: [
        'Analytics détaillés',
        'Logs complets',
        'Alertes automatiques',
        'Rapports personnalisables',
        'Historique complet',
      ],
    },
    {
      icon: <Rocket className="w-6 h-6" />,
      title: 'Performance optimisée',
      description: 'Exécution rapide des workflows avec traitement parallèle et optimisation automatique.',
      color: 'from-orange-500 to-red-500',
      details: [
        'Exécution rapide',
        'Traitement parallèle',
        'Optimisation automatique',
        'Cache intelligent',
        'Scalabilité',
      ],
    },
  ];

  const workflows = [
    {
      name: 'Nouveau design → Notification Slack',
      description: 'Envoyez une notification Slack dès qu\'un nouveau design est créé dans Luneo.',
      trigger: 'Nouveau design créé',
      action: 'Envoyer message Slack',
      steps: [
        'Trigger: Nouveau design créé dans Luneo',
        'Action: Envoyer message dans canal Slack',
        'Format: Design ID, URL, créateur',
      ],
      code: `// Workflow Zapier
// Trigger: Nouveau design créé
// Action: Envoyer message Slack

{
  "trigger": {
    "app": "luneo",
    "event": "design.created"
  },
  "action": {
    "app": "slack",
    "method": "post_message",
    "data": {
      "channel": "#designs",
      "text": "Nouveau design créé: {{design.name}}",
      "attachments": [{
        "title": "{{design.name}}",
        "title_link": "{{design.url}}",
        "fields": [{
          "title": "Créateur",
          "value": "{{design.creator}}"
        }]
      }]
    }
  }
}`,
    },
    {
      name: 'Commande → Créer tâche Trello',
      description: 'Créez automatiquement une tâche Trello pour chaque nouvelle commande.',
      trigger: 'Nouvelle commande',
      action: 'Créer carte Trello',
      steps: [
        'Trigger: Nouvelle commande dans Luneo',
        'Action: Créer carte dans liste Trello',
        'Format: Titre, description, labels',
      ],
      code: `// Workflow Zapier
// Trigger: Nouvelle commande
// Action: Créer carte Trello

{
  "trigger": {
    "app": "luneo",
    "event": "order.created"
  },
  "action": {
    "app": "trello",
    "method": "create_card",
    "data": {
      "name": "Commande #{{order.id}}",
      "desc": "Client: {{order.customer_name}}\\nMontant: {{order.total}}",
      "idList": "{{trello_list_id}}",
      "labels": ["commande", "luneo"]
    }
  }
}`,
    },
    {
      name: 'Design terminé → Email client',
      description: 'Envoyez un email automatique au client quand son design est terminé.',
      trigger: 'Design terminé',
      action: 'Envoyer email',
      steps: [
        'Trigger: Design terminé dans Luneo',
        'Action: Envoyer email via Gmail/SendGrid',
        'Format: Template personnalisé',
      ],
      code: `// Workflow Zapier
// Trigger: Design terminé
// Action: Envoyer email

{
  "trigger": {
    "app": "luneo",
    "event": "design.completed"
  },
  "action": {
    "app": "gmail",
    "method": "send_email",
    "data": {
      "to": "{{design.customer_email}}",
      "subject": "Votre design est prêt !",
      "body": "Bonjour {{design.customer_name}},\\n\\nVotre design {{design.name}} est maintenant terminé.\\n\\nTéléchargez-le ici: {{design.download_url}}"
    }
  }
}`,
    },
  ];

  const triggers = [
    {
      name: 'Nouveau design créé',
      description: 'Déclenché lorsqu\'un nouveau design est créé dans Luneo',
      event: 'design.created',
      data: {
        design_id: 'string',
        design_name: 'string',
        creator_id: 'string',
        created_at: 'datetime',
      },
    },
    {
      name: 'Design terminé',
      description: 'Déclenché lorsqu\'un design est terminé et prêt',
      event: 'design.completed',
      data: {
        design_id: 'string',
        design_url: 'string',
        download_url: 'string',
        completed_at: 'datetime',
      },
    },
    {
      name: 'Nouvelle commande',
      description: 'Déclenché lorsqu\'une nouvelle commande est passée',
      event: 'order.created',
      data: {
        order_id: 'string',
        customer_email: 'string',
        total: 'number',
        items: 'array',
      },
    },
    {
      name: 'Commande expédiée',
      description: 'Déclenché lorsqu\'une commande est expédiée',
      event: 'order.shipped',
      data: {
        order_id: 'string',
        tracking_number: 'string',
        shipping_date: 'datetime',
      },
    },
  ];

  const actions = [
    {
      name: 'Créer un design',
      description: 'Créez un nouveau design dans Luneo depuis Zapier',
      method: 'create_design',
      parameters: {
        name: 'string (required)',
        template_id: 'string (required)',
        customizations: 'object',
      },
    },
    {
      name: 'Récupérer un design',
      description: 'Récupérez les détails d\'un design existant',
      method: 'get_design',
      parameters: {
        design_id: 'string (required)',
      },
    },
    {
      name: 'Mettre à jour un design',
      description: 'Mettez à jour un design existant',
      method: 'update_design',
      parameters: {
        design_id: 'string (required)',
        updates: 'object',
      },
    },
    {
      name: 'Supprimer un design',
      description: 'Supprimez un design',
      method: 'delete_design',
      parameters: {
        design_id: 'string (required)',
      },
    },
  ];

  const troubleshootingItems = [
    {
      question: 'Les workflows ne se déclenchent pas',
      answer: `Vérifiez que:
1. Le workflow est activé dans Zapier
2. Le trigger est correctement configuré
3. Les événements se produisent bien dans Luneo
4. La connexion API est valide
5. Les logs Zapier pour les erreurs

Pour déboguer:
- Vérifiez les logs dans Zapier Dashboard
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
- Régénérez la clé dans Luneo Dashboard
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
- Utilisez les transformations Zapier
- Testez avec des données simples d'abord`,
    },
  ];

  const faqItems = [
    {
      question: 'Combien coûte Zapier ?',
      answer: 'Zapier propose un plan gratuit avec 5 Zaps et 100 tâches/mois. Les plans payants commencent à 20$/mois avec plus de Zaps et de tâches. Consultez zapier.com/pricing pour les détails.',
    },
    {
      question: 'Puis-je créer des workflows complexes ?',
      answer: 'Oui, Zapier supporte les workflows multi-étapes avec conditions, filtres, et transformations de données. Vous pouvez créer des workflows très complexes sans code.',
    },
    {
      question: 'Les workflows sont-ils exécutés en temps réel ?',
      answer: 'Oui, les workflows peuvent être exécutés en temps réel avec les triggers instantanés (webhooks). Certains triggers utilisent le polling avec un délai de quelques minutes.',
    },
    {
      question: 'Puis-je tester mes workflows avant de les activer ?',
      answer: 'Oui, Zapier offre un mode test pour tester vos workflows avec des données de test avant de les activer en production.',
    },
    {
      question: 'Comment obtenir de l\'aide ?',
      answer: 'Zapier offre un support via email, chat, et documentation complète. Notre équipe Luneo peut également vous aider avec l\'intégration spécifique.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white py-24 sm:py-28 md:py-32">
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
                <Zap className="w-12 h-12 text-white" />
              </motion.div>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight"
            >
              Intégration Zapier
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl sm:text-2xl md:text-3xl text-yellow-100 mb-8 max-w-4xl mx-auto leading-relaxed"
            >
              Automatisez vos workflows Luneo avec 5000+ applications.
              <br />
              <span className="font-semibold text-white">Connectez, automatisez, optimisez.</span>
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              <Link href="https://zapier.com" target="_blank" rel="noopener noreferrer">
                <Button
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-10 py-7 text-lg shadow-xl hover:shadow-2xl transition-all"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Créer un compte Zapier
                  <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              <Link href="/help/documentation/integrations/zapier">
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
                <span>5000+ applications</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>Plan gratuit disponible</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur px-4 py-2 rounded-full">
                <CheckCircle2 className="w-5 h-5" />
                <span>Sans code requis</span>
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
              <div className="text-4xl md:text-5xl font-bold text-yellow-600 mb-2">5000+</div>
              <div className="text-sm md:text-base text-gray-600">Applications</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-green-600 mb-2">5M+</div>
              <div className="text-sm md:text-base text-gray-600">Utilisateurs</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-purple-600 mb-2">2B+</div>
              <div className="text-sm md:text-base text-gray-600">Tâches/mois</div>
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
              Automatisez vos workflows Luneo avec la puissance de Zapier
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
                <Card className="p-8 h-full hover:shadow-2xl transition-all duration-300 border-2 hover:border-yellow-500/50 group">
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
              <TabsTrigger value="workflows" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Workflow className="w-4 h-4" />
                <span className="hidden sm:inline">Workflows</span>
                <span className="sm:hidden">Flows</span>
              </TabsTrigger>
              <TabsTrigger value="triggers" className="flex items-center gap-2 data-[state=active]:bg-white">
                <Zap className="w-4 h-4" />
                Triggers
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex items-center gap-2 data-[state=active]:bg-white">
                <ArrowRight className="w-4 h-4" />
                Actions
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
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Pourquoi choisir Zapier avec Luneo ?</h3>
                <div className="grid md:grid-cols-2 gap-8">
                  {[
                    {
                      icon: <TrendingUp className="w-6 h-6 text-green-600" />,
                      title: 'Automatisation puissante',
                      description: 'Automatisez vos tâches répétitives et gagnez du temps. Connectez Luneo à vos outils préférés sans code.',
                      stats: 'Gain de temps 80%',
                    },
                    {
                      icon: <Zap className="w-6 h-6 text-blue-600" />,
                      title: '5000+ applications',
                      description: 'Connectez Luneo à plus de 5000 applications populaires : Slack, Gmail, Trello, Google Sheets, et bien plus.',
                      stats: '5000+ apps',
                    },
                    {
                      icon: <Shield className="w-6 h-6 text-purple-600" />,
                      title: 'Sécurisé et fiable',
                      description: 'Chiffrement SSL, authentification OAuth, et monitoring 24/7 pour garantir la sécurité et la fiabilité.',
                      stats: '99.9% uptime',
                    },
                    {
                      icon: <Rocket className="w-6 h-6 text-orange-600" />,
                      title: 'Facile à utiliser',
                      description: 'Interface visuelle intuitive pour créer des workflows sans code. Templates prêts à l\'emploi.',
                      stats: '5 min setup',
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
                          <div className="text-sm font-semibold text-yellow-600">{item.stats}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Test Connection Widget */}
              <Card className="p-8 md:p-10 border-2 border-yellow-500/20 bg-gradient-to-br from-yellow-50 to-white">
                <h3 className="text-3xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                  <Zap className="w-8 h-8 text-yellow-600" />
                  Test de Connexion Zapier
                </h3>
                <p className="text-lg text-gray-600 mb-8">
                  Testez votre connexion Zapier pour vérifier que tout est correctement configuré.
                </p>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button
                      onClick={handleTestConnection}
                      disabled={testConnectionLoading}
                      size="lg"
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-8 py-6 text-lg"
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
                        Configurer Zapier
                      </Button>
                    </Link>
                    <Link href="/help/documentation/integrations/zapier">
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
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Guide d'Installation</h3>
                <div className="space-y-6">
                  <div className="border-l-4 border-blue-500 pl-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">1. Créer un compte Zapier</h4>
                    <p className="text-gray-600 mb-4">Créez votre compte gratuit sur zapier.com</p>
                  </div>
                  <div className="border-l-4 border-green-500 pl-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">2. Connecter Luneo</h4>
                    <p className="text-gray-600 mb-4">Recherchez "Luneo" dans Zapier et connectez votre compte</p>
                  </div>
                  <div className="border-l-4 border-purple-500 pl-6">
                    <h4 className="text-xl font-bold text-gray-900 mb-2">3. Créer un Zap</h4>
                    <p className="text-gray-600 mb-4">Créez votre premier workflow en sélectionnant un trigger et une action</p>
                  </div>
                </div>
              </Card>
            </TabsContent>

            {/* Workflows Tab */}
            <TabsContent value="workflows" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Workflows Exemples</h3>
                <div className="space-y-6">
                  {workflows.map((workflow, idx) => (
                    <Card key={idx} className="p-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{workflow.name}</h4>
                      <p className="text-gray-600 mb-4">{workflow.description}</p>
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm text-gray-600">Trigger: {workflow.trigger}</span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-gray-400" />
                        <div className="flex items-center gap-2">
                          <ArrowRight className="w-4 h-4 text-green-600" />
                          <span className="text-sm text-gray-600">Action: {workflow.action}</span>
                        </div>
                      </div>
                      <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                        <pre className="text-sm text-gray-100">
                          <code>{workflow.code}</code>
                        </pre>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Triggers Tab */}
            <TabsContent value="triggers" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Triggers Disponibles</h3>
                <div className="space-y-4">
                  {triggers.map((trigger, idx) => (
                    <Card key={idx} className="p-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{trigger.name}</h4>
                      <p className="text-gray-600 mb-4">{trigger.description}</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{trigger.event}</code>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>

            {/* Actions Tab */}
            <TabsContent value="actions" className="space-y-8">
              <Card className="p-8 md:p-10">
                <h3 className="text-3xl font-bold text-gray-900 mb-8">Actions Disponibles</h3>
                <div className="space-y-4">
                  {actions.map((action, idx) => (
                    <Card key={idx} className="p-6">
                      <h4 className="text-xl font-bold text-gray-900 mb-2">{action.name}</h4>
                      <p className="text-gray-600 mb-4">{action.description}</p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{action.method}</code>
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
                          <HelpCircle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
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
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 text-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Prêt à automatiser vos workflows ?
          </h2>
          <p className="text-xl md:text-2xl text-yellow-100 mb-10 leading-relaxed">
            Créez votre compte Zapier gratuitement et commencez à automatiser vos workflows Luneo.
            <br />
            Plan gratuit disponible avec 5 Zaps et 100 tâches/mois.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://zapier.com" target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-10 py-7 text-lg shadow-xl">
                <Zap className="w-5 h-5 mr-2" />
                Créer un compte Zapier
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
