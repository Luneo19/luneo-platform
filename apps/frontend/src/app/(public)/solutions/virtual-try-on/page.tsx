'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Camera,
  Glasses,
  Watch,
  Gem,
  CheckCircle,
  ArrowRight,
  Play,
  Download,
  Share2,
  Smartphone,
  Shield,
  Lock,
  ChevronDown,
  Star,
  Quote,
  Calculator,
  X,
  Pause,
  Circle,
  Info,
  Settings,
  BarChart3,
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

// Demo products
const demoProducts: Product[] = [
  { id: '1', name: 'Aviator Classic', image: '/images/products/glasses-1.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 1 } },
  { id: '2', name: 'Wayfarer Sport', image: '/images/products/glasses-2.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 0.95 } },
  { id: '3', name: 'Cat Eye Luxe', image: '/images/products/glasses-3.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 1.05 } },
  { id: '4', name: 'Round Vintage', image: '/images/products/glasses-4.png', category: 'glasses', overlayPosition: { x: 50, y: 35, scale: 0.9 } },
];

// Testimonials
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
    answer: "Non ! Tout fonctionne directement dans le navigateur (Chrome, Safari, Edge). Pour l'AR mobile natif, nous exportons automatiquement en USDZ (iOS AR Quick Look) et GLB (Android Scene Viewer) pour une expérience '1-tap' sans installation.",
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
  const { data: solutionData } = useSolutionData('virtual-try-on');

  // Demo states
  const [cameraActive, setCameraActive] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
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

  // Dynamic testimonials
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

  // ROI calculations
  const roiCalculations = useMemo(() => {
    const reducedReturnRate = currentReturnRate * 0.4;
    const savedReturns = monthlyOrders * (currentReturnRate / 100 - reducedReturnRate / 100);
    const returnCostSaved = savedReturns * averageOrderValue * 0.3;
    const conversionIncrease = monthlyOrders * 0.4;
    const additionalRevenue = conversionIncrease * averageOrderValue;
    const monthlyBenefit = returnCostSaved + additionalRevenue;
    const annualBenefit = monthlyBenefit * 12;
    const luneoCost = 79 * 12;
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

  // Simulated face tracking
  const simulateFaceTracking = useCallback(() => {
    if (!canvasRef.current || !videoRef.current || !cameraActive) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;

    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    if (!faceDetected && cameraActive) {
      setTimeout(() => setFaceDetected(true), 1500);
      setTimeout(() => setTrackingActive(true), 2000);
    }

    if (trackingActive && selectedProduct) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height * 0.4;
      const faceWidth = canvas.width * 0.3;
      const faceHeight = canvas.height * 0.4;

      ctx.beginPath();
      ctx.ellipse(centerX, centerY, faceWidth / 2, faceHeight / 2, 0, 0, Math.PI * 2);
      ctx.stroke();

      const leftEyeX = centerX - faceWidth * 0.2;
      const rightEyeX = centerX + faceWidth * 0.2;
      const eyeY = centerY - faceHeight * 0.1;

      ctx.fillStyle = 'rgba(6, 182, 212, 0.8)';
      [leftEyeX, rightEyeX].forEach(x => {
        ctx.beginPath();
        ctx.arc(x, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

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

  const capturePhoto = useCallback(() => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `luneo-try-on-${selectedProduct?.name || 'capture'}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
  }, [selectedProduct]);

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

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Hero Section - Clean and Professional */}
      <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left: Text Content */}
            <div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 text-gray-900 leading-tight">
                Virtual Try-On
                <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                  pour votre E-commerce
                </span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Permettez à vos clients d&apos;essayer vos produits en temps réel directement depuis leur navigateur. 
                Augmentez vos conversions et réduisez les retours avec notre technologie AR de pointe.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  onClick={handleStartCamera}
                  disabled={cameraActive}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-8 py-6 text-lg"
                >
                  {cameraActive ? 'Caméra Active' : 'Essayer Maintenant'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Link href="/register">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-gray-300 hover:bg-gray-50 px-8 py-6 text-lg"
                  >
                    Essai Gratuit 14 Jours
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right: Demo Preview */}
            <div className="relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border-2 border-gray-200 bg-white shadow-xl">
                {cameraActive ? (
                  <>
                    <video
                      ref={videoRef}
                      className="absolute inset-0 w-full h-full object-cover opacity-0"
                      playsInline
                      muted
                    />
                    <canvas
                      ref={canvasRef}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${trackingActive ? 'bg-green-500' : faceDetected ? 'bg-yellow-500' : 'bg-blue-500'}`} />
                      <span className="text-sm font-medium bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-gray-900">
                        {trackingActive ? 'Tracking actif' : faceDetected ? 'Visage détecté' : 'Recherche...'}
                      </span>
                    </div>

                    {selectedProduct && (
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg flex items-center gap-2">
                        <Glasses className="w-4 h-4 text-gray-700" />
                        <span className="text-sm text-gray-900">{selectedProduct.name}</span>
                      </div>
                    )}

                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={capturePhoto}
                          className="bg-white/90 hover:bg-white"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Photo
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={toggleVideoRecording}
                          className={`${recording ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-white/90 hover:bg-white'}`}
                        >
                          {recording ? <Pause className="w-4 h-4 mr-1" /> : <Circle className="w-4 h-4 mr-1" />}
                          {recording ? 'Stop' : 'Rec'}
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
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100">
                    <Camera className="w-16 h-16 text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">Démo Interactive</h3>
                    <p className="text-gray-600 text-center mb-6 text-sm">
                      Cliquez sur &quot;Essayer Maintenant&quot; pour activer votre caméra
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Shield className="w-4 h-4" />
                      <span>Aucune donnée stockée • Traitement local</span>
                    </div>
                  </div>
                )}

                {streamError && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-50 backdrop-blur-sm">
                    <div className="text-center p-6">
                      <X className="w-12 h-12 text-red-500 mx-auto mb-4" />
                      <p className="text-red-700">{streamError}</p>
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
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Pourquoi Choisir Luneo Virtual Try-On ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Des résultats mesurables qui transforment votre e-commerce
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                title: 'Augmentez vos Conversions',
                description: 'Les clients qui utilisent le Virtual Try-On convertissent 40% plus souvent.',
                stat: '+40%',
                icon: <CheckCircle className="w-8 h-8" />,
              },
              {
                title: 'Réduisez les Retours',
                description: 'Les clients voient exactement comment le produit leur va. Résultat : 60% de retours en moins.',
                stat: '-60%',
                icon: <CheckCircle className="w-8 h-8" />,
              },
              {
                title: 'Engagement x3',
                description: 'Les utilisateurs passent 3x plus de temps sur votre site.',
                stat: 'x3',
                icon: <CheckCircle className="w-8 h-8" />,
              },
              {
                title: 'ROI en 2 Mois',
                description: 'La plupart de nos clients voient un retour sur investissement positif dès le 2ème mois.',
                stat: '2 mois',
                icon: <CheckCircle className="w-8 h-8" />,
              },
            ].map((benefit, index) => (
              <motion
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white border border-gray-200 p-6 h-full hover:shadow-lg transition-shadow">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-gray-900">{benefit.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{benefit.description}</p>
                  <div className="text-3xl font-bold text-purple-600">{benefit.stat}</div>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Fonctionnalités
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une technologie de pointe pour une expérience utilisateur exceptionnelle
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Tracking Facial 468 Points',
                description: 'MediaPipe Face Mesh pour un suivi ultra-précis en temps réel.',
                icon: <Camera className="w-6 h-6" />,
              },
              {
                title: 'Lunettes 3D Photo-Réalistes',
                description: 'Overlay 3D avec ajustement automatique à la morphologie.',
                icon: <Glasses className="w-6 h-6" />,
              },
              {
                title: 'Montres & Bracelets',
                description: 'Tracking main 21 points pour essayage de montres et bracelets.',
                icon: <Watch className="w-6 h-6" />,
              },
              {
                title: "Boucles d'Oreilles & Bijoux",
                description: 'Placement automatique avec détection précise des oreilles.',
                icon: <Gem className="w-6 h-6" />,
              },
              {
                title: 'AR Mobile Natif',
                description: 'Export USDZ (iOS) et GLB (Android) avec expérience 1-tap.',
                icon: <Smartphone className="w-6 h-6" />,
              },
              {
                title: 'Capture Photo/Vidéo 4K',
                description: "Capture d'écran HD et enregistrement vidéo de l'essayage.",
                icon: <Download className="w-6 h-6" />,
              },
              {
                title: 'Performance 60 FPS',
                description: 'Optimisé GPU avec WebGL 2.0 pour une fluidité garantie.',
                icon: <CheckCircle className="w-6 h-6" />,
              },
              {
                title: 'Partage Social Direct',
                description: 'Export direct Instagram, TikTok, Facebook avec branding personnalisé.',
                icon: <Share2 className="w-6 h-6" />,
              },
            ].map((feature, index) => (
              <motion
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
              >
                <Card className="bg-white border border-gray-200 p-6 h-full hover:border-purple-300 transition-colors">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 text-purple-600">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 text-sm">{feature.description}</p>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Comment Ça Fonctionne ?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Une intégration simple en 3 étapes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                step: '1',
                title: 'Intégration en 5 Minutes',
                description: 'Ajoutez notre widget à votre site avec une simple ligne de code. Compatible Shopify, WooCommerce, Magento.',
              },
              {
                step: '2',
                title: 'Uploadez vos Modèles 3D',
                description: 'Importez vos produits 3D (GLB, FBX) ou utilisez notre service de création 3D à partir de photos.',
              },
              {
                step: '3',
                title: 'Vos Clients Essayent en AR',
                description: 'Vos clients peuvent maintenant essayer vos produits en temps réel directement depuis leur navigateur.',
              },
            ].map((step, index) => (
              <motion
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
              >
                <Card className="bg-white border border-gray-200 p-8 h-full">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl mb-6">
                    {step.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-gray-900">{step.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{step.description}</p>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Calculez Votre Retour sur Investissement
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Estimez les économies et revenus supplémentaires
            </p>
          </div>

          <Card className="bg-white border border-gray-200 p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-8">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Settings className="w-5 h-5 text-purple-600" />
                  Vos Métriques Actuelles
                </h3>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Commandes mensuelles : <span className="font-bold">{monthlyOrders.toLocaleString()}</span>
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="10000"
                    step="100"
                    value={monthlyOrders}
                    onChange={(e) => setMonthlyOrders(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>100</span>
                    <span>10,000</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Panier moyen : <span className="font-bold">{averageOrderValue}€</span>
                  </label>
                  <input
                    type="range"
                    min="20"
                    max="500"
                    step="10"
                    value={averageOrderValue}
                    onChange={(e) => setAverageOrderValue(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>20€</span>
                    <span>500€</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taux de retour actuel : <span className="font-bold">{currentReturnRate}%</span>
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="50"
                    step="1"
                    value={currentReturnRate}
                    onChange={(e) => setCurrentReturnRate(Number(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>5%</span>
                    <span>50%</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-green-600" />
                  Impact Estimé
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Retours évités/mois</p>
                    <p className="text-2xl font-bold text-green-600">{roiCalculations.savedReturns}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Économie retours/mois</p>
                    <p className="text-2xl font-bold text-green-600">{roiCalculations.returnCostSaved.toLocaleString()}€</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Conversions supplémentaires</p>
                    <p className="text-2xl font-bold text-purple-600">+{roiCalculations.conversionIncrease}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <p className="text-sm text-gray-600 mb-1">Revenu additionnel/mois</p>
                    <p className="text-2xl font-bold text-purple-600">{roiCalculations.additionalRevenue.toLocaleString()}€</p>
                  </div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-purple-50 rounded-xl p-6 border border-green-200">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Bénéfice annuel estimé</p>
                      <p className="text-3xl font-bold text-gray-900">{roiCalculations.annualBenefit.toLocaleString()}€</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">ROI annuel</p>
                      <p className="text-3xl font-bold text-green-600">{roiCalculations.roi.toLocaleString()}%</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-4 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Basé sur -60% retours et +40% conversions
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Ce Que Disent Nos Clients
            </h2>
            <p className="text-xl text-gray-600">
              Retours d&apos;expérience de leaders de l&apos;e-commerce
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {dynamicTestimonials.map((testimonial, index) => (
              <motion
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="bg-white border border-gray-200 p-6 h-full">
                  <Quote className="w-8 h-8 text-purple-200 mb-4" />
                  
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>

                  <p className="text-gray-700 mb-6 leading-relaxed">&quot;{testimonial.content}&quot;</p>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                        {testimonial.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{testimonial.name}</p>
                        <p className="text-xs text-gray-500">{testimonial.role}, {testimonial.company}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs px-2 py-1 bg-purple-100 text-purple-600 rounded-full">{testimonial.category}</span>
                      <p className="text-sm font-bold text-green-600 mt-1">{testimonial.metric}</p>
                    </div>
                  </div>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Sécurité & Conformité
            </h2>
            <p className="text-xl text-gray-600">
              Protection des données et respect de la vie privée
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: <Lock className="w-6 h-6" />, title: 'Traitement Local', desc: 'Aucune donnée faciale envoyée aux serveurs' },
              { icon: <Shield className="w-6 h-6" />, title: 'RGPD Compliant', desc: 'Pas de stockage de données biométriques' },
              { icon: <CheckCircle className="w-6 h-6" />, title: 'CDN Européen', desc: 'Hébergement et données en Europe' },
              { icon: <Lock className="w-6 h-6" />, title: 'SOC 2 Type II', desc: 'Audit de sécurité indépendant' },
            ].map((item, i) => (
              <motion
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
              >
                <Card className="bg-white border border-gray-200 p-6 text-center h-full">
                  <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4 text-purple-600">
                    {item.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.desc}</p>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Questions Fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {faqItems.map((item, index) => (
              <motion
                key={index}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card
                  className={`bg-white border border-gray-200 overflow-hidden transition-colors cursor-pointer ${
                    openFaqIndex === index ? 'border-purple-300' : 'hover:border-gray-300'
                  }`}
                  onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 pr-8">{item.question}</h3>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                          openFaqIndex === index ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                    {openFaqIndex === index && (
                      <p className="text-gray-600 mt-4 leading-relaxed">{item.answer}</p>
                    )}
                  </div>
                </Card>
              </motion>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-purple-600 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Prêt à Transformer Votre E-commerce ?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Rejoignez les marques qui utilisent le Virtual Try-On pour augmenter leurs conversions de 40% et réduire leurs retours de 60%.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={handleStartCamera}
              className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-6 text-lg"
            >
              <Play className="mr-2 w-5 h-5" />
              Essayer la Démo
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Link href="/contact">
              <Button
                size="lg"
                variant="outline"
                className="border-white text-white hover:bg-white/10 px-8 py-6 text-lg"
              >
                Parler à un Expert
              </Button>
            </Link>
          </div>
          <p className="text-sm mt-8 opacity-75">
            Aucune carte de crédit requise • Essai gratuit 14 jours • Annulez quand vous voulez
          </p>
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
