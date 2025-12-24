'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Camera,
  Glasses,
  Watch,
  Gem,
  Zap,
  Eye,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Share2,
  Smartphone,
  TrendingUp,
  Play,
  Video,
  Download,
  Users,
  Globe,
  Cpu,
  Shield,
  Lock,
  ChevronDown,
  Star,
  Quote,
  Calculator,
  RotateCw,
  Palette,
  RefreshCcw,
  X,
  Pause,
  Circle,
  Info,
  Code,
  Terminal,
  Settings,
  BarChart3,
  ShieldCheck,
  Server,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';
import { useSolutionData } from '@/lib/hooks/useSolutionData';
import { FAQStructuredData, ProductStructuredData } from '@/components/seo/StructuredData';

// Types
interface Product {
  id: string;
  name: string;
  image: string;
  category: 'glasses' | 'watch' | 'jewelry' | 'accessory';
  overlayPosition: { x: number; y: number; scale: number };
}

interface Testimonial {
  name: string;
  role: string;
  company: string;
  avatar: string;
  content: string;
  rating: number;
  category: string;
  metric: string;
}

// Demo products for virtual try-on simulation
const demoProducts: Product[] = [
  { id: '1', name: 'Aviator Classic', image: '/images/products/glasses-1.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 1 } },
  { id: '2', name: 'Wayfarer Sport', image: '/images/products/glasses-2.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 0.95 } },
  { id: '3', name: 'Cat Eye Luxe', image: '/images/products/glasses-3.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 1.05 } },
  { id: '4', name: 'Round Vintage', image: '/images/products/glasses-4.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 0.9 } },
];

// Testimonials data
const testimonials: Testimonial[] = [
  {
    name: 'Sophie Laurent',
    role: 'Directrice E-commerce',
    company: 'Optic 2000',
    avatar: '/images/testimonials/sophie.jpg',
    content: "Le Virtual Try-On a révolutionné notre expérience client. Les ventes en ligne ont augmenté de 45% et les retours ont chuté de 60%. C'est exactement ce dont nous avions besoin.",
    rating: 5,
    category: 'Lunettes',
    metric: '+45% conversions',
  },
  {
    name: 'Marc Dubois',
    role: 'CEO',
    company: 'Bijoux Paris',
    avatar: '/images/testimonials/marc.jpg',
    content: "L'essayage virtuel de bijoux est bluffant de réalisme. Nos clients adorent voir les bagues et boucles d'oreilles sur eux avant d'acheter. ROI positif en 2 mois.",
    rating: 5,
    category: 'Bijoux',
    metric: '-55% retours',
  },
  {
    name: 'Claire Moreau',
    role: 'Head of Digital',
    company: 'Watches & Co',
    avatar: '/images/testimonials/claire.jpg',
    content: "La technologie de tracking main pour les montres est impressionnante. L'intégration a pris 2 jours et le support technique est excellent.",
    rating: 5,
    category: 'Montres',
    metric: 'x3 engagement',
  },
];

// FAQ items
const faqItems = [
  {
    question: 'Comment fonctionne le tracking facial 468 points ?',
    answer: "Nous utilisons MediaPipe Face Mesh de Google, une solution AI on-device qui détecte 468 points de repère sur le visage en temps réel. Cela permet un ajustement ultra-précis des lunettes, boucles d'oreilles, et accessoires. Le processing se fait localement sur l'appareil de l'utilisateur pour une latence minimale et une confidentialité maximale.",
  },
  {
    question: 'Mes clients doivent-ils installer une application ?',
    answer: "Non ! Tout fonctionne directement dans le navigateur (Chrome, Safari, Edge). Pour l'AR mobile native, nous exportons automatiquement en USDZ (iOS AR Quick Look) et GLB (Android Scene Viewer) pour une expérience '1-tap' sans installation.",
  },
  {
    question: 'Quelle est la performance sur mobile bas de gamme ?',
    answer: "Nous garantissons 60 FPS même sur mobile entrée de gamme grâce à notre optimisation WebGL avec LODs adaptatifs. Le système ajuste automatiquement la qualité du rendu pour maintenir la fluidité. Compatible iPhone 8+ et Android 2019+.",
  },
  {
    question: 'Les données faciales sont-elles stockées ?',
    answer: "Non, jamais. Tout le traitement se fait localement sur l'appareil de l'utilisateur. Aucune image faciale n'est envoyée à nos serveurs. Nous sommes 100% conformes RGPD et ne collectons aucune donnée biométrique.",
  },
  {
    question: 'Comment obtenir les modèles 3D de mes produits ?',
    answer: "Plusieurs options : 1) Uploadez vos modèles GLB/FBX existants, 2) Utilisez notre service de création 3D à partir de photos (2-3 jours, à partir de 50€/modèle), 3) Exportez depuis notre Configurateur 3D intégré.",
  },
  {
    question: 'Puis-je personnaliser entièrement le branding ?',
    answer: "Oui ! White-label complet sur plan Enterprise : couleurs, logo, domaine personnalisé, et suppression complète du branding Luneo. Vous pouvez même personnaliser les boutons, l'UI, et les messages.",
  },
];

function VirtualTryOnPageContent() {
  // Récupérer les données dynamiques depuis l'API
  const { data: solutionData, loading: solutionLoading } = useSolutionData('virtual-try-on');

  // Demo states
  const [cameraActive, setCameraActive] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('glasses');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(demoProducts[0]);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [trackingActive, setTrackingActive] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationRef = useRef<number | null>(null);

  // ROI Calculator states
  const [monthlyOrders, setMonthlyOrders] = useState(1000);
  const [averageOrderValue, setAverageOrderValue] = useState(150);
  const [currentReturnRate, setCurrentReturnRate] = useState(25);

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  // Fusionner les témoignages dynamiques avec les statiques
  const dynamicTestimonials = useMemo(() => {
    if (solutionData?.testimonials?.length) {
      return solutionData.testimonials.map((t) => ({
        name: t.author,
        role: t.role,
        company: t.company,
        avatar: '/images/testimonials/default.jpg',
        content: t.quote,
        rating: 5,
        category: 'Général',
        metric: t.result,
      }));
    }
    return testimonials;
  }, [solutionData]);

  // Fusionner les stats dynamiques avec les statiques
  const dynamicStats = useMemo(() => {
    if (solutionData?.stats?.length) {
      return solutionData.stats;
    }
    return [
      { value: '+40%', label: 'Conversions' },
      { value: '-60%', label: 'Retours' },
      { value: '2M+', label: 'Essayages/mois' },
    ];
  }, [solutionData]);

  // Features data
  const features = useMemo(() => [
    {
      icon: <Camera className="w-6 h-6" />,
      title: 'Tracking Facial 468 Points',
      description: 'MediaPipe Face Mesh pour un suivi ultra-précis en temps réel avec reconstruction 3D complète du visage.',
      tech: 'MediaPipe v0.5',
    },
    {
      icon: <Glasses className="w-6 h-6" />,
      title: 'Lunettes 3D Photo-Réalistes',
      description: 'Overlay 3D avec ajustement automatique à la morphologie, reflets réalistes et occlusion naturelle.',
      tech: 'Three.js + PBR',
    },
    {
      icon: <Watch className="w-6 h-6" />,
      title: 'Montres & Bracelets',
      description: 'Tracking main 21 points pour essayage de montres, bracelets et bagues avec ombres réalistes.',
      tech: 'Hand Tracking AI',
    },
    {
      icon: <Gem className="w-6 h-6" />,
      title: "Boucles d'Oreilles & Bijoux",
      description: 'Placement automatique avec détection précise des oreilles et rendu matériaux PBR réaliste.',
      tech: 'Ear Detection AI',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'AR Mobile Natif',
      description: 'Export USDZ (iOS AR Quick Look) et GLB (Android Scene Viewer) avec expérience 1-tap.',
      tech: 'WebXR API',
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Capture Photo/Vidéo 4K',
      description: "Capture d'écran HD et enregistrement vidéo de l'essayage, partage social intégré.",
      tech: 'MediaRecorder API',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Performance 60 FPS Garantie',
      description: 'Optimisé GPU avec WebGL 2.0 pour tracking et rendu fluide même sur mobile entrée de gamme.',
      tech: 'WebGL 2.0 + LODs',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Partage Social Direct',
      description: 'Export direct Instagram, TikTok, Facebook avec hashtags et branding personnalisé.',
      tech: 'Web Share API',
    },
  ], []);

  // Categories data
  const categories = useMemo(() => [
    {
      id: 'glasses',
      title: 'Lunettes',
      description: 'Solaires, vue, sport',
      icon: '🕶️',
      models: '1000+',
      tracking: 'Face Mesh 468 points',
      features: ['Ajustement auto nez/oreilles', 'Reflets réalistes', 'Essai couleurs multiple', 'IPD automatique'],
    },
    {
      id: 'watch',
      title: 'Montres',
      description: 'Luxe, sport, connectées',
      icon: '⌚',
      models: '500+',
      tracking: 'Hand Tracking 21 points',
      features: ['Taille poignet auto', 'Bracelet adaptable', 'Vue 360° interactive', 'Comparaison tailles'],
    },
    {
      id: 'jewelry',
      title: 'Bijoux',
      description: 'Bagues, colliers, boucles',
      icon: '💍',
      models: '800+',
      tracking: 'Face + Hand tracking',
      features: ['Détection oreilles/doigts', 'Matériaux PBR', 'Brillance réaliste', 'Multi-bijoux'],
    },
    {
      id: 'accessory',
      title: 'Accessoires',
      description: 'Casques, chapeaux, sacs',
      icon: '🎩',
      models: '300+',
      tracking: 'Face Mesh full 3D',
      features: ['Ajustement taille tête', 'Gravité/physique', 'Textures HD', 'Personnalisation couleurs'],
    },
  ], []);

  // Tech stack
  const techStack = useMemo(() => [
    { name: 'MediaPipe Face Mesh', description: '468 landmarks faciaux en temps réel avec reconstruction 3D', version: 'v0.5', icon: <Eye className="w-5 h-5" /> },
    { name: 'MediaPipe Hands', description: '21 landmarks main avec détection précise des doigts', version: 'v0.4', icon: <Camera className="w-5 h-5" /> },
    { name: 'Three.js', description: 'Rendu 3D overlay avec PBR materials et shadows', version: 'r160', icon: <Cpu className="w-5 h-5" /> },
    { name: 'WebGL 2.0', description: 'Accélération GPU pour 60 FPS constant et LODs adaptatifs', version: '2.0', icon: <Zap className="w-5 h-5" /> },
    { name: 'USDZ/GLB Export', description: 'AR iOS Quick Look et Android Scene Viewer natifs', version: 'Native', icon: <Smartphone className="w-5 h-5" /> },
    { name: 'WebXR API', description: 'AR navigateur sans app (Chrome, Edge, Safari)', version: '1.0', icon: <Globe className="w-5 h-5" /> },
  ], []);

  // Pricing plans
  const pricingPlans = useMemo(() => [
    {
      name: 'Starter',
      price: '29',
      views: 'Illimitées',
      products: '50',
      features: ['Face tracking lunettes', 'Export photos HD', 'Support email', 'Branding Luneo', 'Analytics basiques'],
    },
    {
      name: 'Pro',
      price: '79',
      views: 'Illimitées',
      products: '500',
      features: ['Tout Starter +', 'Hand tracking montres/bijoux', 'Export AR (USDZ/GLB)', 'Vidéo recording', 'Webhooks', 'Analytics avancées', 'Support prioritaire', 'API complète'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      views: 'Illimitées',
      products: 'Illimité',
      features: ['Tout Pro +', 'White-label complet', 'CDN privé dédié', 'SLA 99.99%', 'Custom AI training', 'Account manager dédié', 'Intégration sur-mesure'],
    },
  ], []);

  // Use cases
  const useCases = useMemo(() => [
    {
      industry: 'Optique & Lunetterie',
      icon: <Glasses className="w-8 h-8" />,
      description: 'Essayage virtuel de lunettes de vue et solaires avec mesure IPD automatique.',
      benefits: ['+45% conversions', '-60% retours', 'Mesure IPD précise'],
      example: 'Optic 2000, Afflelou, GrandVision',
    },
    {
      industry: 'Horlogerie de Luxe',
      icon: <Watch className="w-8 h-8" />,
      description: 'Visualisation sur poignet avec détection taille et rendu photo-réaliste.',
      benefits: ['x3 engagement', '-40% retours', 'Panier moyen +30%'],
      example: 'Rolex, Omega, TAG Heuer',
    },
    {
      industry: 'Joaillerie & Bijoux',
      icon: <Gem className="w-8 h-8" />,
      description: "Essayage bagues, colliers et boucles d'oreilles avec brillance réaliste.",
      benefits: ['+55% conversions', 'Confiance +80%', 'Partage social x5'],
      example: 'Cartier, Tiffany, Swarovski',
    },
    {
      industry: 'Mode & Accessoires',
      icon: <Sparkles className="w-8 h-8" />,
      description: 'Chapeaux, casques, écharpes avec simulation physique réaliste.',
      benefits: ['Différenciation marque', 'UX innovante', 'Viralité sociale'],
      example: 'Gucci, Louis Vuitton, Hermès',
    },
  ], []);

  // ROI calculations
  const roiCalculations = useMemo(() => {
    const reducedReturnRate = currentReturnRate * 0.4; // 60% reduction
    const savedReturns = monthlyOrders * (currentReturnRate / 100 - reducedReturnRate / 100);
    const returnCostSaved = savedReturns * averageOrderValue * 0.3; // 30% of AOV is return cost
    const conversionIncrease = monthlyOrders * 0.4; // 40% more conversions
    const additionalRevenue = conversionIncrease * averageOrderValue;
    const monthlyBenefit = returnCostSaved + additionalRevenue;
    const annualBenefit = monthlyBenefit * 12;
    const luneoCost = 79 * 12; // Pro plan
    const roi = ((annualBenefit - luneoCost) / luneoCost) * 100;

    return {
      savedReturns: Math.round(savedReturns),
      returnCostSaved: Math.round(returnCostSaved),
      conversionIncrease: Math.round(conversionIncrease),
      additionalRevenue: Math.round(additionalRevenue),
      monthlyBenefit: Math.round(monthlyBenefit),
      annualBenefit: Math.round(annualBenefit),
      roi: Math.round(roi),
    };
  }, [monthlyOrders, averageOrderValue, currentReturnRate]);

  // Simulated face tracking effect
  const simulateFaceTracking = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || !cameraActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Simulate face detection (in real implementation, this would use MediaPipe)
    // For demo, we'll simulate detection after a short delay
    if (!faceDetected && cameraActive) {
      setTimeout(() => setFaceDetected(true), 1500);
      setTimeout(() => setTrackingActive(true), 2000);
    }

    // Draw overlay guides when tracking is active
    if (trackingActive && selectedProduct) {
      // Draw face mesh simulation points (simplified)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      
      // Face outline simulation
      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.4;
      const faceWidth = canvas.width * 0.3;
      const faceHeight = canvas.height * 0.4;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, faceWidth / 2, faceHeight / 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Eye positions for glasses overlay
      const leftEyeX = centerX - faceWidth * 0.2;
      const rightEyeX = centerX + faceWidth * 0.2;
      const eyeY = centerY - faceHeight * 0.1;

      // Draw tracking points
      ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
      [leftEyeX, rightEyeX].forEach(x => {
        ctx.beginPath();
        ctx.arc(x, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Product overlay zone indicator
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(
        centerX - faceWidth * 0.5,
        eyeY - 30,
        faceWidth,
        60
      );
      ctx.setLineDash([]);
    }

    animationRef.current = requestAnimationFrame(simulateFaceTracking);
  }, [cameraActive, faceDetected, trackingActive, selectedProduct]);

  // Start camera
  const handleStartCamera = useCallback(async () => {
    try {
      setStreamError(null);
      setFaceDetected(false);
      setTrackingActive(false);

      if (!navigator.mediaDevices?.getUserMedia) {
        setStreamError("Votre navigateur ne supporte pas l'accès caméra.");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraActive(true);
    } catch (error) {
      logger.error('Camera error', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setStreamError("Impossible d'accéder à votre caméra. Vérifiez les permissions.");
      setCameraActive(false);
    }
  }, []);

  // Stop camera
  const handleStopCamera = useCallback(() => {
    setCameraActive(false);
    setFaceDetected(false);
    setTrackingActive(false);
    setStreamError(null);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setRecording(false);
    setRecordedChunks([]);
  }, [recording]);

  // Start tracking simulation when camera is active
  useEffect(() => {
    if (cameraActive) {
      animationRef.current = requestAnimationFrame(simulateFaceTracking);
    }
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cameraActive, simulateFaceTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && recording) {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [recording]);

  // Capture photo
  const capturePhoto = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `luneo-try-on-${selectedProduct?.name || 'capture'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, [selectedProduct]);

  // Toggle video recording
  const toggleVideoRecording = useCallback(() => {
    if (!mediaStreamRef.current) return;

    if (!recording) {
      try {
        const recorder = new MediaRecorder(mediaStreamRef.current, {
          mimeType: 'video/webm;codecs=vp9',
        });

        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            setRecordedChunks((prev) => [...prev, event.data]);
          }
        };

        recorder.onstop = () => {
          const blob = new Blob(recordedChunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `luneo-try-on-${selectedProduct?.name || 'demo'}.webm`;
          link.click();
          URL.revokeObjectURL(url);
          setRecordedChunks([]);
        };

        recorder.start();
        mediaRecorderRef.current = recorder;
        setRecording(true);
      } catch (error) {
        logger.error('Recording error', { error });
      }
    } else {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
  }, [recording, recordedChunks, selectedProduct]);

  // Share demo
  const shareDemo = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Luneo Virtual Try-On',
          text: "Je viens de tester l'essayage virtuel Luneo 🤩 #VirtualTryOn #AR",
          url: typeof window !== 'undefined' ? window.location.href : 'https://app.luneo.app/solutions/virtual-try-on',
        });
      } catch (error) {
        logger.warn('Share cancelled', { error: error instanceof Error ? error.message : 'Unknown error' });
      }
    } else {
      // Fallback: copy to clipboard
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        alert('Lien copié dans le presse-papiers !');
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-20 md:py-24 px-4 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15),transparent_70%)]" />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.1) 0%, transparent 40%)',
                'radial-gradient(circle at 80% 70%, rgba(59, 130, 246, 0.1) 0%, transparent 40%)',
                'radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.1) 0%, transparent 40%)',
                'radial-gradient(circle at 20% 30%, rgba(6, 182, 212, 0.1) 0%, transparent 40%)',
              ],
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          />
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-400">AI-Powered Virtual Try-On</span>
                <span className="px-2 py-0.5 bg-cyan-500/20 rounded-full text-xs">468 Points</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Essayage Virtuel
                </span>
                <br />
                <span className="text-white">Hyper-Réaliste</span>
              </h1>

              <p className="text-lg sm:text-xl text-slate-300 mb-8 leading-relaxed max-w-xl">
                Permettez à vos clients d&apos;essayer <strong className="text-cyan-400">lunettes</strong>, <strong className="text-blue-400">montres</strong> et <strong className="text-purple-400">bijoux</strong> en temps réel avec notre technologie AR.
                <br /><br />
                <span className="text-sm text-slate-400">
                  Tracking <span className="text-cyan-400 font-mono">468 points</span> du visage • <span className="text-blue-400 font-mono">21 points</span> de la main • <span className="text-green-400 font-mono">60 FPS</span> garanti
                </span>
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-4 gap-4 mb-8">
                {[
                  { value: '+40%', label: 'Conversions', color: 'from-cyan-400 to-blue-400' },
                  { value: '-60%', label: 'Retours', color: 'from-green-400 to-emerald-400' },
                  { value: 'x3', label: 'Engagement', color: 'from-purple-400 to-pink-400' },
                  { value: '60', label: 'FPS', color: 'from-orange-400 to-red-400' },
                ].map((stat, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="text-center"
                  >
                    <div className={`text-2xl sm:text-3xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>
                      {stat.value}
                    </div>
                    <div className="text-xs text-slate-500">{stat.label}</div>
                  </motion.div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleStartCamera}
                  disabled={cameraActive}
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/25 group"
                >
                  <Camera className="mr-2 w-5 h-5" />
                  {cameraActive ? 'Caméra Active' : 'Essayer Maintenant'}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Link href="/auth/register">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-slate-600 hover:bg-slate-800/50 px-8 py-6 text-lg w-full sm:w-auto"
                  >
                    Essai Gratuit 14 Jours
                  </Button>
                </Link>
              </div>
            </motion.div>

            {/* Right: Interactive Demo Preview */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-cyan-500/30 bg-slate-900/80 backdrop-blur-sm shadow-2xl shadow-cyan-500/10">
                {cameraActive ? (
                  <>
                    {/* Video element (hidden, used as source) */}
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover opacity-0"
                      playsInline
                      muted
                    />
                    {/* Canvas with overlays */}
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Tracking status */}
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1, repeat: Infinity }}
                        className={`w-3 h-3 rounded-full ${trackingActive ? 'bg-green-500' : faceDetected ? 'bg-yellow-500' : 'bg-cyan-500'}`}
                      />
                      <span className="text-sm font-medium bg-black/50 backdrop-blur-sm px-3 py-1 rounded-full">
                        {trackingActive ? 'Tracking actif' : faceDetected ? 'Visage détecté' : 'Recherche...'}
                      </span>
                    </div>

                    {/* Selected product indicator */}
                    {selectedProduct && (
                      <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                        <Glasses className="w-4 h-4 text-cyan-400" />
                        <span className="text-sm">{selectedProduct.name}</span>
                      </div>
                    )}

                    {/* Controls overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={capturePhoto}
                          className="bg-white/10 backdrop-blur-sm hover:bg-white/20"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Photo
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={toggleVideoRecording}
                          className={`backdrop-blur-sm ${recording ? 'bg-red-500/50 hover:bg-red-500/70' : 'bg-white/10 hover:bg-white/20'}`}
                        >
                          {recording ? <Pause className="w-4 h-4 mr-1" /> : <Circle className="w-4 h-4 mr-1" />}
                          {recording ? 'Stop' : 'Rec'}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={shareDemo}
                          className="bg-white/10 backdrop-blur-sm hover:bg-white/20"
                        >
                          <Share2 className="w-4 h-4 mr-1" />
                          Partager
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleStopCamera}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Fermer
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="w-24 h-24 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-full flex items-center justify-center mb-6"
                    >
                      <Camera className="w-12 h-12 text-cyan-400" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2">Démo Interactive</h3>
                    <p className="text-slate-400 text-center mb-6 text-sm">
                      Cliquez sur &quot;Essayer Maintenant&quot; pour activer votre caméra et tester l&apos;essayage virtuel
                    </p>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Shield className="w-4 h-4" />
                      <span>Aucune donnée stockée • Traitement local</span>
                    </div>
                  </div>
                )}

                {streamError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-950/50 backdrop-blur-sm">
                    <div className="text-center p-6">
                      <X className="w-12 h-12 text-red-400 mx-auto mb-4" />
                      <p className="text-red-300">{streamError}</p>
                      <Button
                        className="mt-4"
                        variant="outline"
                        onClick={() => setStreamError(null)}
                      >
                        Réessayer
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Product selector (shown when camera is active) */}
              {cameraActive && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-700"
                >
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-cyan-400" />
                    Changer de modèle
                  </h4>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {demoProducts.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product)}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm transition-all ${
                          selectedProduct?.id === product.id
                            ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        } border border-slate-600`}
                      >
                        {product.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 border-y border-slate-800">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-slate-500 text-sm mb-8">UTILISÉ PAR LES LEADERS DE L&apos;OPTIQUE ET DE LA JOAILLERIE</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {['Optic 2000', 'Afflelou', 'GrandVision', 'Swarovski', 'Tissot', 'Fossil'].map((brand, i) => (
              <motion.div
                key={brand}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-xl font-semibold text-slate-400"
              >
                {brand}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Technologie AR de <span className="text-cyan-400">Pointe</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              MediaPipe + Three.js + WebGL 2.0 pour un réalisme maximal et une performance 60 FPS garantie
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-700 p-6 h-full hover:border-cyan-500/50 hover:bg-slate-900/80 transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <div className="text-cyan-400">{feature.icon}</div>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed mb-3">{feature.description}</p>
                  <span className="text-xs text-cyan-400/70 font-mono">{feature.tech}</span>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Cas d&apos;Usage par <span className="text-cyan-400">Industrie</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Une solution adaptée à chaque secteur avec des résultats prouvés
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {useCases.map((useCase, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-900/80 border-slate-700 p-8 h-full hover:border-cyan-500/30 transition-all">
                  <div className="flex items-start gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                      <div className="text-cyan-400">{useCase.icon}</div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold mb-2 text-white">{useCase.industry}</h3>
                      <p className="text-slate-400 mb-4">{useCase.description}</p>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {useCase.benefits.map((benefit, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 bg-green-500/10 text-green-400 text-sm rounded-full border border-green-500/20"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                      
                      <p className="text-xs text-slate-500">
                        <span className="text-slate-400">Clients :</span> {useCase.example}
                      </p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Catégories <span className="text-cyan-400">Supportées</span>
            </h2>
            <p className="text-xl text-slate-400">
              Essayage AR pour tous types de produits avec précision professionnelle
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`p-6 h-full cursor-pointer transition-all ${
                    selectedCategory === category.id
                      ? 'bg-cyan-500/10 border-cyan-500'
                      : 'bg-slate-900/50 border-slate-700 hover:border-cyan-500/50'
                  }`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  <div className="text-5xl mb-4">{category.icon}</div>
                  <h3 className="text-xl font-bold mb-2 text-white">{category.title}</h3>
                  <p className="text-slate-400 text-sm mb-3">{category.description}</p>
                  <div className="flex items-center gap-2 text-xs text-cyan-400 mb-4">
                    <span className="font-mono">{category.models} modèles</span>
                    <span className="text-slate-600">•</span>
                    <span>{category.tracking}</span>
                  </div>
                  <ul className="space-y-2">
                    {category.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-slate-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-full mb-6">
              <Calculator className="w-4 h-4 text-green-400" />
              <span className="text-sm font-medium text-green-400">Calculateur ROI</span>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Calculez Votre <span className="text-green-400">Retour sur Investissement</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-2xl mx-auto">
              Estimez les économies et revenus supplémentaires grâce au Virtual Try-On
            </p>
          </motion.div>

          <Card className="bg-slate-900/80 border-slate-700 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Inputs */}
              <div className="space-y-8">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  Vos Métriques Actuelles
                </h3>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Commandes mensuelles : <span className="text-white font-bold">{monthlyOrders.toLocaleString()}</span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={monthlyOrders}
                    onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>100</span>
                    <span>10,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Panier moyen : <span className="text-white font-bold">{averageOrderValue}€</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    value={averageOrderValue}
                    onChange={(e) => setAverageOrderValue(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>20€</span>
                    <span>500€</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-400 mb-2">
                    Taux de retour actuel : <span className="text-white font-bold">{currentReturnRate}%</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={currentReturnRate}
                    onChange={(e) => setCurrentReturnRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>5%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>

              {/* Results */}
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-400" />
                  Impact Estimé avec Virtual Try-On
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Retours évités/mois</p>
                    <p className="text-2xl font-bold text-green-400">{roiCalculations.savedReturns}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Économie retours/mois</p>
                    <p className="text-2xl font-bold text-green-400">{roiCalculations.returnCostSaved.toLocaleString()}€</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Conversions supplémentaires</p>
                    <p className="text-2xl font-bold text-cyan-400">+{roiCalculations.conversionIncrease}</p>
                  </div>
                  <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                    <p className="text-sm text-slate-400 mb-1">Revenu additionnel/mois</p>
                    <p className="text-2xl font-bold text-cyan-400">{roiCalculations.additionalRevenue.toLocaleString()}€</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-500/20 to-cyan-500/20 rounded-xl p-6 border border-green-500/30">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-400 mb-1">Bénéfice annuel estimé</p>
                      <p className="text-3xl font-bold text-white">{roiCalculations.annualBenefit.toLocaleString()}€</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-400 mb-1">ROI annuel</p>
                      <p className="text-3xl font-bold text-green-400">{roiCalculations.roi.toLocaleString()}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 mt-4 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Basé sur -60% retours et +40% conversions (moyennes clients Luneo)
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Stack <span className="text-blue-400">Technique</span>
            </h2>
            <p className="text-xl text-slate-400">
              Technologies de pointe pour une expérience AR sans compromis
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="bg-slate-900/50 border-slate-700 p-6 h-full hover:border-blue-500/30 transition-all">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                      {tech.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white">{tech.name}</h3>
                        <span className="text-xs text-blue-400 font-mono bg-blue-500/10 px-2 py-1 rounded">{tech.version}</span>
                      </div>
                      <p className="text-sm text-slate-400">{tech.description}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pipeline Diagram */}
          <Card className="bg-slate-900/80 border-slate-700 p-8">
            <h3 className="text-lg font-semibold text-white mb-8 text-center">Pipeline de Traitement</h3>
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              {[
                { icon: <Camera className="w-8 h-8" />, title: 'Camera Input', sub: 'WebRTC Stream', color: 'cyan' },
                { icon: <Cpu className="w-8 h-8" />, title: 'AI Tracking', sub: 'MediaPipe 468+21', color: 'purple' },
                { icon: <Sparkles className="w-8 h-8" />, title: '3D Rendering', sub: 'Three.js + WebGL', color: 'blue' },
                { icon: <Eye className="w-8 h-8" />, title: 'Display', sub: '60 FPS Real-time', color: 'green' },
              ].map((step, i) => (
                <React.Fragment key={i}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="text-center flex-1"
                  >
                    <div className={`w-20 h-20 bg-${step.color}-500/20 rounded-2xl flex items-center justify-center mx-auto mb-3 text-${step.color}-400`}>
                      {step.icon}
                    </div>
                    <p className="font-semibold text-white">{step.title}</p>
                    <p className="text-xs text-slate-500">{step.sub}</p>
                  </motion.div>
                  {i < 3 && (
                    <ArrowRight className="w-6 h-6 text-slate-600 rotate-90 md:rotate-0 flex-shrink-0" />
                  )}
                </React.Fragment>
              ))}
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Ce Que Disent Nos <span className="text-cyan-400">Clients</span>
            </h2>
            <p className="text-xl text-slate-400">
              Retours d&apos;expérience de leaders de l&apos;e-commerce
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dynamicTestimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-slate-900/80 border-slate-700 p-6 h-full relative">
                  <Quote className="absolute top-4 right-4 w-8 h-8 text-cyan-500/20" />
                  
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-slate-300 mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>

                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-white">{testimonial.name}</p>
                        <p className="text-xs text-slate-500">{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded-full">{testimonial.category}</span>
                      <p className="text-sm font-bold text-green-400 mt-1">{testimonial.metric}</p>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security & Compliance Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Sécurité & <span className="text-green-400">Conformité</span>
            </h2>
            <p className="text-xl text-slate-400">
              Protection des données et respect de la vie privée
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Lock className="w-6 h-6" />, title: 'Traitement Local', desc: 'Aucune donnée faciale envoyée aux serveurs', color: 'cyan' },
              { icon: <Shield className="w-6 h-6" />, title: 'RGPD Compliant', desc: 'Pas de stockage de données biométriques', color: 'green' },
              { icon: <Server className="w-6 h-6" />, title: 'CDN Européen', desc: 'Hébergement et données en Europe', color: 'blue' },
              { icon: <ShieldCheck className="w-6 h-6" />, title: 'SOC 2 Type II', desc: 'Audit de sécurité indépendant', color: 'purple' },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <Card className="bg-slate-900/50 border-slate-700 p-6 text-center h-full">
                  <div className={`w-14 h-14 bg-${item.color}-500/20 rounded-xl flex items-center justify-center mx-auto mb-4 text-${item.color}-400`}>
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-400">{item.desc}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* API Documentation Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Intégration <span className="text-cyan-400">Simple</span>
            </h2>
            <p className="text-xl text-slate-400">
              SDK complet et API RESTful pour tous vos besoins
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* React SDK */}
            <Card className="bg-slate-900/80 border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Code className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-white">React SDK</h3>
                <span className="text-xs px-2 py-0.5 bg-cyan-500/20 text-cyan-400 rounded">v2.0</span>
              </div>
              <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-slate-300">{`import { VirtualTryOn, useTracking } from '@luneo/vto-react';

function GlassesViewer({ productId }) {
  const { isTracking, faceData, error } = useTracking();

  return (
    <VirtualTryOn
      apiKey={process.env.LUNEO_API_KEY}
      productId={productId}
      category="glasses"
      onTrackingStart={() => logger.info('Tracking started')}
      onCapture={(image) => handleCapture(image)}
      onError={(err) => logger.error(err)}
    >
      {({ startCamera, capturePhoto, isReady }) => (
        <div>
          <video ref={videoRef} />
          <Button onClick={startCamera}>Start</Button>
          <Button onClick={capturePhoto}>Capture</Button>
        </div>
      )}
    </VirtualTryOn>
  );
}`}</pre>
              </div>
            </Card>

            {/* REST API */}
            <Card className="bg-slate-900/80 border-slate-700 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Terminal className="w-5 h-5 text-blue-400" />
                <h3 className="font-semibold text-white">REST API</h3>
                <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">OpenAPI 3.0</span>
              </div>
              <div className="bg-slate-950 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                <pre className="text-slate-300">{`# Upload 3D model for try-on
curl -X POST https://api.luneo.app/v1/vto/models \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: multipart/form-data" \\
  -F "file=@glasses.glb" \\
  -F "category=glasses" \\
  -F "name=Aviator Classic"

# Generate AR export (USDZ/GLB)
curl -X POST https://api.luneo.app/v1/vto/export \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{"modelId": "123", "format": "usdz"}'

# Webhooks for capture events
POST https://your-site.com/webhook
{
  "event": "vto.capture",
  "productId": "123",
  "imageUrl": "https://cdn.luneo.app/captures/..."
}`}</pre>
              </div>
            </Card>
          </div>

          <div className="text-center mt-8">
            <Link href="/docs/virtual-try-on">
              <Button variant="outline" className="border-slate-600 hover:bg-slate-800">
                <Code className="w-4 h-4 mr-2" />
                Documentation Complète
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Tarifs <span className="text-cyan-400">Transparents</span>
            </h2>
            <p className="text-xl text-slate-400">
              Pas de limite de vues, pas de surprises
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card
                  className={`p-8 h-full relative ${
                    plan.popular
                      ? 'bg-gradient-to-b from-cyan-900/30 to-blue-900/30 border-cyan-500'
                      : 'bg-slate-900/50 border-slate-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full text-sm font-medium">
                        Le plus populaire
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold mb-2 text-white">{plan.name}</h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {plan.price === 'Custom' ? '' : '$'}{plan.price}
                    </span>
                    {plan.price !== 'Custom' && <span className="text-slate-400">/mois</span>}
                  </div>

                  <div className="space-y-2 mb-6 text-sm">
                    <p className="text-slate-300">
                      <span className="font-semibold text-white">{plan.views}</span> vues AR
                    </p>
                    <p className="text-slate-300">
                      <span className="font-semibold text-white">{plan.products}</span> produits
                    </p>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link href={plan.price === 'Custom' ? '/contact' : '/auth/register'}>
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500'
                          : 'bg-slate-800 hover:bg-slate-700 border border-slate-600'
                      }`}
                    >
                      {plan.price === 'Custom' ? 'Contactez-nous' : 'Commencer'}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-8">
            <p className="text-slate-500 text-sm">
              Tous les plans incluent : Essai gratuit 14 jours • Annulation à tout moment • Support technique
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-900/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
              Questions <span className="text-cyan-400">Fréquentes</span>
            </h2>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className={`bg-slate-900/80 border-slate-700 overflow-hidden transition-all cursor-pointer ${
                    openFaqIndex === index ? 'border-cyan-500/50' : 'hover:border-slate-600'
                  }`}
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white pr-8">{item.question}</h3>
                      <ChevronDown
                        className={`w-5 h-5 text-slate-400 transition-transform flex-shrink-0 ${
                          openFaqIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    <AnimatePresence>
                      {openFaqIndex === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <p className="text-slate-400 mt-4 leading-relaxed">{item.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-slate-950 via-cyan-950/20 to-slate-950">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Sparkles className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              Prêt à Transformer Votre E-commerce ?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Rejoignez les marques qui utilisent le Virtual Try-On pour augmenter leurs conversions de 40% et réduire leurs retours de 60%.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                onClick={handleStartCamera}
                className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white px-8 py-6 text-lg shadow-lg shadow-cyan-500/25 group"
              >
                <Play className="mr-2 w-5 h-5" />
                Essayer la Démo
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Link href="/contact">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-slate-600 hover:bg-slate-800 px-8 py-6 text-lg w-full sm:w-auto"
                >
                  Parler à un Expert
                </Button>
              </Link>
            </div>
            <p className="text-slate-500 text-sm mt-8">
              Aucune carte de crédit requise • Essai gratuit 14 jours • Annulez quand vous voulez
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default function VirtualTryOnPage() {
  return (
    <>
      <FAQStructuredData questions={faqItems} />
      <ProductStructuredData
        name="Virtual Try-On AR"
        description="Essayage virtuel en réalité augmentée avec tracking facial 468 points. Compatible mobile et desktop, export USDZ/GLB pour AR native."
      />
      <ErrorBoundary level="page" componentName="VirtualTryOnPage">
        <VirtualTryOnPageContent />
      </ErrorBoundary>
    </>
  );
}
