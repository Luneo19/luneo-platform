'use client';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { HeroBannerOptimized } from '@/components/HeroBannerOptimized';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMarketingData } from '@/lib/hooks/useMarketingData';
import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowRight,
    Award,
    BadgeCheck,
    Box,
    Check,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    Download,
    Dumbbell,
    ExternalLink,
    Eye,
    FileCheck,
    Gem,
    Gift,
    Globe,
    Layers,
    Lock,
    MessageSquare,
    Minus,
    Package,
    Palette,
    Play,
    Rocket,
    Server,
    Share2,
    Shield,
    Shirt,
    ShoppingCart,
    Sofa,
    Sparkles,
    TrendingUp,
    Upload,
    Users,
    UtensilsCrossed,
    X,
    Zap
} from 'lucide-react';
import Link from 'next/link';
import React, { memo, useCallback, useMemo, useState } from 'react';

// Types
interface FAQ {
  question: string;
  answer: string;
}

interface SuccessStory {
  metric: string;
  label: string;
  company: string;
  quote: string;
  author: string;
  role: string;
  avatar: string;
  gradient: string;
  logo?: string;
}

interface Integration {
  name: string;
  category: string;
  logo: string;
  description: string;
}

interface ComparisonFeature {
  name: string;
  luneo: boolean | string;
  zakeke: boolean | string;
  canva: boolean | string;
  adobe: boolean | string;
}

// Composant FAQ Item
function FAQItem({ faq, isOpen, onToggle }: { faq: FAQ; isOpen: boolean; onToggle: () => void }) {
  return (
    <motion.div
      initial={false}
      className="border border-gray-700 rounded-xl overflow-hidden bg-gray-800/50 backdrop-blur-sm"
    >
      <button
        onClick={onToggle}
        className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-gray-700/50 transition-colors"
      >
        <span className="font-semibold text-white text-sm sm:text-base pr-4">{faq.question}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="px-6 pb-5 text-gray-300 text-sm leading-relaxed border-t border-gray-700 pt-4">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Composant Step Card
function StepCard({ 
  step, 
  number, 
  title, 
  description, 
  icon, 
  gradient 
}: { 
  step: number;
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: step * 0.15 }}
      className="relative"
    >
      {/* Connector Line */}
      {step < 3 && (
        <div className="hidden lg:block absolute top-1/2 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-transparent z-0" />
      )}
      
      <Card className="relative z-10 bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6 sm:p-8 hover:border-purple-500/50 transition-all group h-full">
        {/* Step Number */}
        <div className={`absolute -top-4 -left-4 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-r ${gradient} flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-lg`}>
          {number}
        </div>
        
        {/* Icon */}
        <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r ${gradient} flex items-center justify-center mb-4 sm:mb-6 group-hover:scale-110 transition-transform`}>
          {icon}
        </div>
        
        <h3 className="text-lg sm:text-xl font-bold text-white mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{description}</p>
      </Card>
    </motion.div>
  );
}

// Main Component
function HomePageContent() {
  const [showTopBar, setShowTopBar] = useState(true);
  const [openFAQIndex, setOpenFAQIndex] = useState<number | null>(0);
  const [activeTab, setActiveTab] = useState<'monthly' | 'yearly'>('yearly');

  // Récupérer les données marketing depuis l'API
  const { 
    testimonials: apiTestimonials, 
    stats: apiStats, 
    integrations: apiIntegrations,
    industries: apiIndustries,
    loading: marketingLoading 
  } = useMarketingData();

  // Memoized data
  const gridItems = useMemo(() => Array.from({ length: 96 }, (_, i) => i), []);
  
  const particles = useMemo(
    () =>
      Array.from({ length: 20 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        top: `${(i * 59) % 100}%`,
        delay: `${((i * 13) % 30) / 10}s`,
        duration: `${2.2 + ((i * 7) % 20) / 10}s`,
      })),
    []
  );

  // Fusionner les statistiques dynamiques avec les fallbacks
  const topStats = useMemo(
    () => {
      if (apiStats.length > 0) {
        return apiStats.map((stat, i) => ({
          value: stat.value,
          label: stat.description || stat.label,
          icon: i === 0 ? <Users className="w-5 h-5" /> : 
                i === 1 ? <Sparkles className="w-5 h-5" /> : 
                i === 2 ? <Zap className="w-5 h-5" /> : 
                <Globe className="w-5 h-5" />,
        }));
      }
      return [
        { value: '10,000+', label: 'Créateurs actifs', icon: <Users className="w-5 h-5" /> },
        { value: '500M+', label: 'Designs générés', icon: <Sparkles className="w-5 h-5" /> },
        { value: '3.2s', label: 'Temps moyen génération', icon: <Zap className="w-5 h-5" /> },
        { value: '150+', label: 'Pays', icon: <Globe className="w-5 h-5" /> },
      ];
    },
    [apiStats]
  );

  // Fusionner les témoignages dynamiques avec les fallbacks
  const successStories: SuccessStory[] = useMemo(
    () => {
      const gradients = [
        'from-blue-500 to-cyan-500',
        'from-purple-500 to-pink-500',
        'from-green-500 to-emerald-500',
        'from-orange-500 to-red-500',
      ];

      // Si des témoignages de l'API sont disponibles, les utiliser
      if (apiTestimonials.length > 0) {
        return apiTestimonials.map((t, i) => ({
          metric: `${t.rating}★`,
          label: 'Note client',
          company: t.company,
          quote: t.quote,
          author: t.author,
          role: t.company,
          avatar: t.author.split(' ').map(n => n[0]).join(''),
          gradient: gradients[i % gradients.length],
        }));
      }

      // Fallback aux données statiques
      return [
        {
          metric: '+500%',
          label: 'Croissance',
          company: 'LA FABRIQUE À SACHETS',
          quote: 'De 100 à 600 commandes/mois sans embaucher. Luneo a permis notre scale et automatisé notre production de designs print-ready.',
          author: 'Marie Bertrand',
          role: 'CEO & Fondatrice',
          avatar: 'MB',
          gradient: 'from-blue-500 to-cyan-500',
        },
        {
          metric: '100%',
          label: 'Sell-out',
          company: 'DESIGN ITALIAN SHOES',
          quote: 'La visualisation 3D premium a éliminé le besoin d\'échantillons physiques. 100% de sell-out sur notre dernière collection.',
          author: 'Francesco Colombo',
          role: 'Chief Operating Officer',
          avatar: 'FC',
          gradient: 'from-purple-500 to-pink-500',
        },
        {
          metric: '-80%',
          label: 'Temps production',
          company: 'KAZE CLUB',
          quote: 'Les fichiers print-ready automatiques ont été un game-changer. Plus de 80% de temps de workflow économisé.',
          author: 'Christian Martinez',
          role: 'Creative Director',
          avatar: 'CM',
          gradient: 'from-green-500 to-emerald-500',
        },
        {
          metric: '+45%',
          label: 'Conversions',
          company: 'OPTIQUE PARIS',
          quote: 'Le virtual try-on a transformé notre e-commerce. +45% de conversions et -60% de retours produits.',
          author: 'Sophie Leclerc',
          role: 'Directrice E-commerce',
          avatar: 'SL',
          gradient: 'from-orange-500 to-red-500',
        },
      ];
    },
    [apiTestimonials]
  );

  const howItWorksSteps = useMemo(
    () => [
      {
        number: '1',
        title: 'Uploadez ou Créez',
        description: 'Importez vos designs existants ou générez-en de nouveaux avec notre IA. Formats supportés: PNG, SVG, PSD, AI, GLTF, OBJ.',
        icon: <Upload className="w-7 h-7 text-white" />,
        gradient: 'from-blue-500 to-cyan-500',
      },
      {
        number: '2',
        title: 'Personnalisez',
        description: 'Utilisez notre éditeur visuel pour modifier couleurs, textes, formes. Prévisualisez en 3D et AR en temps réel.',
        icon: <Palette className="w-7 h-7 text-white" />,
        gradient: 'from-purple-500 to-pink-500',
      },
      {
        number: '3',
        title: 'Configurez',
        description: 'Ajustez les matériaux, textures et finitions. Créez des variantes automatiquement avec notre moteur de règles.',
        icon: <Layers className="w-7 h-7 text-white" />,
        gradient: 'from-pink-500 to-orange-500',
      },
      {
        number: '4',
        title: 'Exportez & Intégrez',
        description: 'Téléchargez en haute résolution (300 DPI, CMYK) ou intégrez directement à votre boutique via notre API.',
        icon: <Download className="w-7 h-7 text-white" />,
        gradient: 'from-green-500 to-emerald-500',
      },
    ],
    []
  );

  const technologies = useMemo(
    () => [
      {
        icon: <Sparkles className="w-7 h-7" />,
        title: 'IA Générative',
        description: 'Créez 1000 designs uniques en 1 heure au lieu d\'1 mois de travail manuel',
        features: ['DALL-E 3 & Midjourney', 'Prompts optimisés', 'Export HD 4K', 'Batch generation'],
        gradient: 'from-blue-500 to-cyan-500',
        stats: '1000x plus rapide'
      },
      {
        icon: <Box className="w-7 h-7" />,
        title: '3D Photoréaliste',
        description: 'Économisez €50,000+/an en photoshoots avec des modèles 3D indiscernables',
        features: ['Three.js / WebGL', 'Rotation 360° fluide', 'Materials PBR', 'Export GLTF/USDZ'],
        gradient: 'from-purple-500 to-pink-500',
        stats: '€50K économisés'
      },
      {
        icon: <Eye className="w-7 h-7" />,
        title: 'AR & Virtual Try-On',
        description: '+40% de conversions avec un essayage virtuel hyper-réaliste',
        features: ['WebXR natif', 'Face tracking 468 pts', 'Hand tracking 21 pts', 'Social sharing'],
        gradient: 'from-cyan-500 to-teal-500',
        stats: '+40% conversions'
      },
      {
        icon: <Package className="w-7 h-7" />,
        title: 'Print Automation',
        description: '-90% de temps de production avec fichiers print-ready automatiques',
        features: ['300 DPI CMYK', 'PDF/X-4 certifié', 'Bleed auto 3mm', 'Color profiles ICC'],
        gradient: 'from-orange-500 to-red-500',
        stats: '-90% temps prod'
      }
    ],
    []
  );

  // Fusionner les industries dynamiques avec les fallbacks
  const industries = useMemo(
    () => {
      const iconMap: Record<string, React.ReactNode> = {
        'Package': <Package className="w-6 h-6" />,
        'Shirt': <Shirt className="w-6 h-6" />,
        'Dumbbell': <Dumbbell className="w-6 h-6" />,
        'ShoppingCart': <ShoppingCart className="w-6 h-6" />,
        'Gem': <Gem className="w-6 h-6" />,
        'Sofa': <Sofa className="w-6 h-6" />,
        'UtensilsCrossed': <UtensilsCrossed className="w-6 h-6" />,
        'Gift': <Gift className="w-6 h-6" />,
        'Car': <Box className="w-6 h-6" />,
        'Laptop': <Box className="w-6 h-6" />,
      };

      const colorMap = [
        'from-blue-500 to-blue-600',
        'from-pink-500 to-pink-600',
        'from-green-500 to-green-600',
        'from-purple-500 to-purple-600',
        'from-yellow-500 to-yellow-600',
        'from-orange-500 to-orange-600',
        'from-red-500 to-red-600',
        'from-cyan-500 to-cyan-600',
      ];

      if (apiIndustries.length > 0) {
        return apiIndustries.map((ind, i) => ({
          name: ind.name,
          slug: ind.link.replace('/industries/', ''),
          icon: iconMap[ind.icon] || <Box className="w-6 h-6" />,
          color: colorMap[i % colorMap.length],
        }));
      }

      return [
        { name: 'Impression', slug: 'printing', icon: <Package className="w-6 h-6" />, color: 'from-blue-500 to-blue-600' },
        { name: 'Mode & Textile', slug: 'fashion', icon: <Shirt className="w-6 h-6" />, color: 'from-pink-500 to-pink-600' },
        { name: 'Sport', slug: 'sports', icon: <Dumbbell className="w-6 h-6" />, color: 'from-green-500 to-green-600' },
        { name: 'E-commerce', slug: 'ecommerce', icon: <ShoppingCart className="w-6 h-6" />, color: 'from-purple-500 to-purple-600' },
        { name: 'Bijouterie', slug: 'jewellery', icon: <Gem className="w-6 h-6" />, color: 'from-yellow-500 to-yellow-600' },
        { name: 'Mobilier', slug: 'furniture', icon: <Sofa className="w-6 h-6" />, color: 'from-orange-500 to-orange-600' },
        { name: 'Food & Beverage', slug: 'food-beverage', icon: <UtensilsCrossed className="w-6 h-6" />, color: 'from-red-500 to-red-600' },
        { name: 'Cadeaux', slug: 'gifting', icon: <Gift className="w-6 h-6" />, color: 'from-cyan-500 to-cyan-600' },
      ];
    },
    [apiIndustries]
  );

  // Fusionner les intégrations dynamiques avec les fallbacks
  const integrations: Integration[] = useMemo(
    () => {
      if (apiIntegrations.length > 0) {
        return apiIntegrations.map((int) => ({
          name: int.name,
          category: int.description,
          logo: `/logos/${int.name.toLowerCase()}.svg`,
          description: int.description,
        }));
      }

      return [
        { name: 'Shopify', category: 'E-commerce', logo: '/logos/shopify.svg', description: 'Intégration native' },
        { name: 'WooCommerce', category: 'E-commerce', logo: '/logos/woocommerce.svg', description: 'Plugin officiel' },
        { name: 'Magento', category: 'E-commerce', logo: '/logos/magento.svg', description: 'Extension complète' },
        { name: 'PrestaShop', category: 'E-commerce', logo: '/logos/prestashop.svg', description: 'Module certifié' },
        { name: 'Printful', category: 'POD', logo: '/logos/printful.svg', description: 'Sync automatique' },
        { name: 'Gelato', category: 'POD', logo: '/logos/gelato.svg', description: 'Production globale' },
        { name: 'Stripe', category: 'Paiement', logo: '/logos/stripe.svg', description: 'Checkout intégré' },
        { name: 'Zapier', category: 'Automation', logo: '/logos/zapier.svg', description: '1000+ apps' },
      ];
    },
    [apiIntegrations]
  );

  const faqs: FAQ[] = useMemo(
    () => [
      {
        question: 'Comment fonctionne l\'essai gratuit de 14 jours ?',
        answer: 'Inscrivez-vous sans carte bancaire et accédez à toutes les fonctionnalités Pro pendant 14 jours. Vous pouvez créer des designs, utiliser l\'IA, exporter en haute résolution. À la fin de l\'essai, choisissez le plan qui vous convient ou continuez gratuitement avec des limitations.'
      },
      {
        question: 'Puis-je annuler mon abonnement à tout moment ?',
        answer: 'Oui, absolument. Pas d\'engagement, pas de frais cachés. Annulez en 1 clic depuis votre dashboard. Vos fichiers restent accessibles pendant 30 jours après l\'annulation pour les télécharger.'
      },
      {
        question: 'Les fichiers exportés sont-ils vraiment print-ready ?',
        answer: 'Oui. Nos exports sont certifiés print-ready : 300 DPI minimum, profil couleur CMYK (ISO Coated v2), format PDF/X-4, marges de découpe 3mm automatiques. Acceptés par 99% des imprimeurs professionnels.'
      },
      {
        question: 'Quelles plateformes e-commerce supportez-vous ?',
        answer: 'Nous avons des intégrations natives avec Shopify, WooCommerce, Magento, PrestaShop, BigCommerce, Wix, Squarespace. Pour les autres plateformes, notre API REST et nos webhooks permettent une intégration custom en quelques heures.'
      },
      {
        question: 'Comment fonctionne la génération IA de designs ?',
        answer: 'Notre IA utilise les derniers modèles (DALL-E 3, Stable Diffusion XL) avec des prompts optimisés pour le e-commerce. Décrivez votre idée en français ou anglais, et obtenez des designs professionnels en secondes. Vous gardez tous les droits commerciaux.'
      },
      {
        question: 'Mes données sont-elles sécurisées ?',
        answer: 'Absolument. Infrastructure hébergée sur AWS Europe (Paris), conforme RGPD. Données chiffrées AES-256 au repos et TLS 1.3 en transit. SOC 2 Type II en cours de certification. Nous ne partageons jamais vos données avec des tiers.'
      },
      {
        question: 'Puis-je utiliser Luneo en marque blanche ?',
        answer: 'Oui, avec le plan Enterprise. Personnalisez entièrement l\'interface (logo, couleurs, domaine custom), supprimez toute mention de Luneo. Idéal pour les agences et les grandes marques souhaitant offrir une expérience client 100% brandée.'
      },
      {
        question: 'Quelle est la différence avec Zakeke ou Canva ?',
        answer: 'Luneo combine le meilleur des deux : l\'éditeur produit de Zakeke ET les capacités créatives de Canva, PLUS l\'IA générative, la 3D photoréaliste et l\'AR. Tout en un, avec export print-ready professionnel. Voir notre comparatif détaillé.'
      },
    ],
    []
  );

  const comparisonFeatures: ComparisonFeature[] = useMemo(
    () => [
      { name: 'IA Générative (DALL-E, SD)', luneo: true, zakeke: false, canva: 'Limité', adobe: true },
      { name: 'Visualisation 3D temps réel', luneo: true, zakeke: true, canva: false, adobe: 'Plugin' },
      { name: 'Virtual Try-On AR', luneo: true, zakeke: true, canva: false, adobe: false },
      { name: 'Export Print-Ready CMYK', luneo: true, zakeke: true, canva: 'Limité', adobe: true },
      { name: 'Intégrations e-commerce', luneo: true, zakeke: true, canva: false, adobe: false },
      { name: 'API & Webhooks', luneo: true, zakeke: true, canva: false, adobe: true },
      { name: 'Collaboration temps réel', luneo: true, zakeke: false, canva: true, adobe: true },
      { name: 'White-label', luneo: true, zakeke: true, canva: false, adobe: false },
      { name: 'Support français 24/7', luneo: true, zakeke: false, canva: false, adobe: false },
      { name: 'Tarif entrée de gamme', luneo: '29€', zakeke: '49€', canva: '12€', adobe: '60€' },
    ],
    []
  );

  const securityFeatures = useMemo(
    () => [
      { icon: <Shield className="w-6 h-6" />, title: 'RGPD Compliant', description: 'Hébergement AWS Paris, DPO dédié' },
      { icon: <Lock className="w-6 h-6" />, title: 'Chiffrement AES-256', description: 'Données au repos et en transit' },
      { icon: <Server className="w-6 h-6" />, title: 'SOC 2 Type II', description: 'Certification en cours Q2 2025' },
      { icon: <FileCheck className="w-6 h-6" />, title: 'ISO 27001', description: 'Processus de certification initié' },
      { icon: <BadgeCheck className="w-6 h-6" />, title: 'SSO & 2FA', description: 'SAML, OAuth, Authenticator' },
      { icon: <Globe className="w-6 h-6" />, title: 'Uptime 99.99%', description: 'SLA garanti, monitoring 24/7' },
    ],
    []
  );

  const toggleFAQ = useCallback((index: number) => {
    setOpenFAQIndex(prev => prev === index ? null : index);
  }, []);

  return (
    <main id="main-content" className="min-h-screen bg-gray-900 overflow-x-hidden">
      {/* ============================================ */}
      {/* TOP ANNOUNCEMENT BANNER */}
      {/* ============================================ */}
      <AnimatePresence>
        {showTopBar && (
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white py-2.5 sm:py-3 px-4 relative z-50"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 sm:gap-4 text-center">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse flex-shrink-0" />
              <span className="font-bold text-xs sm:text-sm tracking-wide">NOUVEAU</span>
              <span className="text-xs sm:text-sm hidden xs:inline">IA Générative 3D + AR + Customization Automatisée</span>
              <span className="text-xs sm:hidden">IA 3D + AR disponible</span>
              <Link href="/changelog" className="hidden sm:flex items-center gap-1 text-xs bg-white/20 px-2 py-1 rounded-full hover:bg-white/30 transition-colors">
                <span>Voir les nouveautés</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <button
              onClick={() => setShowTopBar(false)}
              className="absolute right-2 sm:right-4 top-1/2 transform -translate-y-1/2 text-white/80 hover:text-white transition-colors p-1"
              aria-label="Fermer la bannière"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================ */}
      {/* HERO SECTION - HeroBannerOptimized */}
      {/* ============================================ */}
      <HeroBannerOptimized
        title="L'Auteure de Personnalisation 3D"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 flex-wrap z-50 relative">
          <Link href="/register" className="group">
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-base sm:text-lg rounded-xl shadow-xl shadow-purple-500/25 transition-all duration-300 group-hover:shadow-purple-500/40"
            >
              Commencer gratuitement
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
          <Link href="/demo" className="group">
            <Button 
              size="lg" 
              variant="outline"
              className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white font-semibold px-8 py-6 text-base sm:text-lg rounded-xl hover:bg-white/20 hover:border-white/40 transition-all duration-300"
            >
              <Play className="w-5 h-5 mr-2" />
              Voir la démo
            </Button>
          </Link>
        </div>
      </HeroBannerOptimized>

      {/* ============================================ */}
      {/* SOCIAL PROOF - TRUSTED BY */}
      {/* ============================================ */}
      <section className="py-10 sm:py-14 bg-gray-800/50 backdrop-blur-sm border-y border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs sm:text-sm font-medium text-gray-400 mb-8 text-center uppercase tracking-wider">
            Utilisé par des marques leaders dans
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-6 sm:gap-8 items-center">
            {industries.slice(0, 8).map((industry, i) => (
              <motion.div
                key={industry.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 0.6, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05, duration: 0.4 }}
                whileHover={{ opacity: 1, scale: 1.05 }}
                className="text-center cursor-pointer"
              >
                <div className={`w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br ${industry.color} flex items-center justify-center text-white opacity-70 hover:opacity-100 transition-opacity`}>
                  {industry.icon}
                </div>
                <span className="text-gray-400 font-medium text-xs sm:text-sm">{industry.name}</span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* HOW IT WORKS */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-400 text-sm font-medium mb-6 border border-blue-500/20">
              <Rocket className="w-4 h-4" />
              Simple & Rapide
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Comment ça{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                fonctionne
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
              En 4 étapes simples, passez de l'idée au produit fini. Aucune compétence technique requise.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {howItWorksSteps.map((step, i) => (
              <StepCard
                key={i}
                step={i}
                number={step.number}
                title={step.title}
                description={step.description}
                icon={step.icon}
                gradient={step.gradient}
              />
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/register">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 shadow-lg">
                <Rocket className="w-5 h-5 mr-2" />
                Démarrer en 30 secondes
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SUCCESS STORIES */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-br from-gray-900 via-blue-950/50 to-purple-950/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full text-green-400 text-sm font-medium mb-6 border border-green-500/20">
              <TrendingUp className="w-4 h-4" />
              Résultats Prouvés
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Ils ont transformé leur{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                business avec Luneo
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
              Résultats réels mesurés. Métriques vérifiables. ROI garanti.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {successStories.map((story, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ y: -5 }}
              >
                <Card className="h-full bg-gray-800/50 backdrop-blur-sm border-gray-700 p-6 sm:p-8 hover:bg-gray-800/70 hover:border-gray-600 transition-all duration-300">
                  {/* Metric */}
                  <div className="mb-6">
                    <div className={`text-4xl sm:text-5xl font-bold bg-gradient-to-r ${story.gradient} bg-clip-text text-transparent mb-2`}>
                      {story.metric}
                    </div>
                    <div className="text-sm text-gray-400 uppercase tracking-wider font-semibold">
                      {story.label}
                    </div>
                  </div>

                  {/* Quote */}
                  <blockquote className="text-base text-gray-300 mb-6 leading-relaxed italic">
                    "{story.quote}"
                  </blockquote>

                  {/* Author */}
                  <div className="flex items-center gap-4 pt-6 border-t border-gray-700">
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${story.gradient} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                      {story.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{story.author}</div>
                      <div className="text-sm text-gray-400">{story.role}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{story.company}</div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/case-studies">
              <Button size="lg" variant="outline" className="bg-white/20 border-white/40 text-white hover:bg-white/30">
                Découvrir toutes les success stories
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* TECHNOLOGIES */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-full text-purple-400 text-sm font-medium mb-6 border border-purple-500/20">
              <Sparkles className="w-4 h-4" />
              Technologies de Pointe
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              La puissance de l'{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                IA nouvelle génération
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
              Technologies d'avenir pour créer des expériences produits qui convertissent
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
            {technologies.map((tech, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="group"
              >
                <Card className="h-full bg-gray-800/30 backdrop-blur-sm border-gray-700/50 p-6 hover:border-purple-500/50 hover:bg-gray-800/50 transition-all duration-300">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${tech.gradient} flex items-center justify-center mb-5 text-white group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    {tech.icon}
                  </div>

                  {/* Stats Badge */}
                  <div className={`inline-flex items-center px-3 py-1 rounded-full bg-gradient-to-r ${tech.gradient} bg-opacity-20 text-xs font-bold mb-4`}>
                    <span className={`bg-gradient-to-r ${tech.gradient} bg-clip-text text-transparent`}>
                      {tech.stats}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white mb-3">{tech.title}</h3>
                  <p className="text-sm text-gray-400 mb-5 leading-relaxed">{tech.description}</p>

                  {/* Features */}
                  <div className="space-y-2">
                    {tech.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center text-sm">
                        <CheckCircle className="w-4 h-4 mr-2 text-green-400 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-12"
          >
            <Link href="/solutions">
              <Button size="lg" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white font-semibold shadow-lg">
                <Sparkles className="w-5 h-5 mr-2" />
                Explorer toutes les solutions
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* COMPARISON TABLE */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gray-800/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 rounded-full text-orange-400 text-sm font-medium mb-6 border border-orange-500/20">
              <Award className="w-4 h-4" />
              Comparatif
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Pourquoi choisir{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Luneo
              </span>
              ?
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
              Comparez-nous aux alternatives. Les faits parlent d'eux-mêmes.
            </p>
          </motion.div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-x-auto"
          >
            <table className="w-full min-w-[700px] border-collapse">
              <thead>
                <tr>
                  <th className="p-4 text-left text-gray-400 font-medium text-sm">Fonctionnalité</th>
                  <th className="p-4 text-center bg-gradient-to-b from-purple-500/20 to-purple-500/5 rounded-t-xl">
                    <div className="text-white font-bold text-lg">Luneo</div>
                    <div className="text-purple-400 text-xs font-medium">Recommandé</div>
                  </th>
                  <th className="p-4 text-center text-gray-400 font-medium">Zakeke</th>
                  <th className="p-4 text-center text-gray-400 font-medium">Canva</th>
                  <th className="p-4 text-center text-gray-400 font-medium">Adobe</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature, i) => (
                  <tr key={i} className="border-t border-gray-700/50">
                    <td className="p-4 text-gray-300 text-sm font-medium">{feature.name}</td>
                    <td className="p-4 text-center bg-purple-500/5">
                      {typeof feature.luneo === 'boolean' ? (
                        feature.luneo ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-gray-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-green-400 font-semibold">{feature.luneo}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.zakeke === 'boolean' ? (
                        feature.zakeke ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-gray-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-yellow-400 text-sm">{feature.zakeke}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.canva === 'boolean' ? (
                        feature.canva ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-gray-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-yellow-400 text-sm">{feature.canva}</span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {typeof feature.adobe === 'boolean' ? (
                        feature.adobe ? (
                          <Check className="w-5 h-5 text-green-400 mx-auto" />
                        ) : (
                          <Minus className="w-5 h-5 text-gray-500 mx-auto" />
                        )
                      ) : (
                        <span className="text-yellow-400 text-sm">{feature.adobe}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* INTEGRATIONS */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 rounded-full text-cyan-400 text-sm font-medium mb-6 border border-cyan-500/20">
              <Share2 className="w-4 h-4" />
              Intégrations
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              S'intègre à vos{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                outils préférés
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
              Connectez Luneo à votre stack existant en quelques clics. API complète disponible.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {integrations.map((integration, i) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
              >
                <Card className="p-5 sm:p-6 bg-gray-800/50 backdrop-blur-sm border-gray-700 hover:border-cyan-500/50 transition-all cursor-pointer h-full flex flex-col items-center text-center">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                    <div className="text-2xl font-bold text-gray-800">{integration.name.charAt(0)}</div>
                  </div>
                  <h3 className="font-bold text-white text-sm sm:text-base mb-1">{integration.name}</h3>
                  <p className="text-xs text-gray-500">{integration.category}</p>
                  <p className="text-xs text-cyan-400 mt-2">{integration.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <Link href="/integrations">
              <Button variant="outline" className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10">
                Voir toutes les intégrations (50+)
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* SECURITY & COMPLIANCE */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 lg:py-24 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 rounded-full text-green-400 text-sm font-medium mb-6 border border-green-500/20">
              <Shield className="w-4 h-4" />
              Sécurité & Conformité
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Vos données sont{' '}
              <span className="bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                en sécurité
              </span>
            </h2>
            <p className="text-base text-gray-400 max-w-2xl mx-auto">
              Infrastructure enterprise-grade, conforme aux standards les plus exigeants
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
            {securityFeatures.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="text-center p-4 sm:p-5 bg-gray-800/50 rounded-xl border border-gray-700/50 hover:border-green-500/30 transition-colors"
              >
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400">
                  {feature.icon}
                </div>
                <h4 className="font-semibold text-white text-sm mb-1">{feature.title}</h4>
                <p className="text-xs text-gray-500">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FAQ SECTION */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gray-900">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 rounded-full text-blue-400 text-sm font-medium mb-6 border border-blue-500/20">
              <MessageSquare className="w-4 h-4" />
              FAQ
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
              Questions{' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                fréquentes
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-400">
              Tout ce que vous devez savoir pour démarrer
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
              >
                <FAQItem
                  faq={faq}
                  isOpen={openFAQIndex === i}
                  onToggle={() => toggleFAQ(i)}
                />
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mt-10"
          >
            <p className="text-gray-400 mb-4">Vous avez d'autres questions ?</p>
            <Link href="/contact">
              <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10">
                <MessageSquare className="w-4 h-4 mr-2" />
                Contactez notre équipe
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* FINAL CTA */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Background Animation */}
        <div className="absolute inset-0 opacity-30">
          {Array.from({ length: 15 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              animate={{ y: [0, -800], opacity: [0, 1, 0] }}
              transition={{ 
                duration: 4 + Math.random() * 3, 
                repeat: Infinity, 
                delay: Math.random() * 4,
                ease: 'linear'
              }}
              style={{ left: `${Math.random() * 100}%`, top: '100%' }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
              Prêt à transformer votre
              <br />
              <span className="text-blue-200">workflow créatif ?</span>
            </h2>
            <p className="text-base sm:text-lg lg:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
              Rejoignez <strong className="text-white">10 000+ créateurs</strong> qui utilisent Luneo pour{' '}
              <strong className="text-white">scaler leur business</strong>.
              <br />
              <span className="text-white font-bold">14 jours gratuits</span>, sans carte bancaire.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Link href="/register">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-white text-purple-600 hover:bg-gray-100 font-bold px-10 py-6 text-lg rounded-xl shadow-2xl"
                >
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link href="/demo">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto bg-white/10 border-2 border-white/40 text-white hover:bg-white/20 font-bold px-10 py-6 text-lg rounded-xl"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Voir la démo
                </Button>
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>14 jours gratuits</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Sans carte bancaire</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Annulation en 1 clic</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-300" />
                <span>Support français 24/7</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ============================================ */}
      {/* INTERACTIVE DEMOS */}
      {/* ============================================ */}
      <section className="py-16 sm:py-20 lg:py-28 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              Essayez Nos{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Démos Interactives
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-400">
              Testez chaque solution directement, sans installation ni inscription
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { 
                href: '/solutions/virtual-try-on', 
                icon: <Eye className="w-10 h-10 sm:w-12 sm:h-12" />,
                title: 'Virtual Try-On',
                description: 'Essayez lunettes, montres, bijoux en AR avec votre caméra',
                cta: 'Essayer',
                color: 'cyan',
                gradient: 'from-cyan-500/20 to-teal-500/20',
                borderColor: 'border-cyan-500/20 hover:border-cyan-500/50'
              },
              { 
                href: '/solutions/configurator-3d', 
                icon: <Box className="w-10 h-10 sm:w-12 sm:h-12" />,
                title: 'Configurateur 3D',
                description: 'Configurez produits en 3D temps réel avec materials PBR',
                cta: 'Tester',
                color: 'blue',
                gradient: 'from-blue-500/20 to-indigo-500/20',
                borderColor: 'border-blue-500/20 hover:border-blue-500/50'
              },
              { 
                href: '/solutions/customizer', 
                icon: <Palette className="w-10 h-10 sm:w-12 sm:h-12" />,
                title: 'Visual Customizer',
                description: 'Éditeur canvas professionnel avec export print-ready',
                cta: 'Créer',
                color: 'purple',
                gradient: 'from-purple-500/20 to-pink-500/20',
                borderColor: 'border-purple-500/20 hover:border-purple-500/50'
              },
              { 
                href: '/solutions/asset-hub', 
                icon: <Package className="w-10 h-10 sm:w-12 sm:h-12" />,
                title: '3D Asset Hub',
                description: 'Upload, optimisez et gérez vos assets 3D',
                cta: 'Uploader',
                color: 'green',
                gradient: 'from-green-500/20 to-emerald-500/20',
                borderColor: 'border-green-500/20 hover:border-green-500/50'
              },
            ].map((demo, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Link href={demo.href} className="block group">
                  <Card className={`bg-gradient-to-br ${demo.gradient} ${demo.borderColor} p-6 sm:p-8 transition-all duration-300 h-full`}>
                    <div className={`text-${demo.color}-400 mb-4 group-hover:scale-110 transition-transform`}>
                      {demo.icon}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">{demo.title}</h3>
                    <p className="text-sm sm:text-base text-gray-400 mb-4">{demo.description}</p>
                    <div className={`flex items-center gap-2 text-${demo.color}-400 text-sm sm:text-base font-medium`}>
                      <span>{demo.cta}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

const MemoizedHomePageContent = memo(HomePageContent);

export default function HomePage() {
  // Structured data for SEO
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Luneo',
    url: 'https://app.luneo.app',
    logo: 'https://app.luneo.app/logo.png',
    description: 'Plateforme de personnalisation produits avec éditeur 2D/3D, Virtual Try-On AR, et export print-ready',
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Luneo Platform',
    url: 'https://app.luneo.app',
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <ErrorBoundary level="page" componentName="HomePage">
        <MemoizedHomePageContent />
      </ErrorBoundary>
    </>
  );
}
