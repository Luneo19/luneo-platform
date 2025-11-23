'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

export default function VirtualTryOnPage() {
  const [cameraActive, setCameraActive] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const features = [
    {
      icon: <Camera className="w-6 h-6" />,
      title: 'Tracking Facial 468 Points',
      description: 'MediaPipe Face Mesh pour un suivi ultra-précis en temps réel avec détection 3D complète.',
    },
    {
      icon: <Glasses className="w-6 h-6" />,
      title: 'Lunettes 3D Réalistes',
      description: 'Overlay 3D avec ajustement automatique à la morphologie du visage et reflets réalistes.',
    },
    {
      icon: <Watch className="w-6 h-6" />,
      title: 'Montres & Bijoux',
      description: 'Tracking main 21 points pour essayage de montres, bagues, bracelets avec ombres réalistes.',
    },
    {
      icon: <Gem className="w-6 h-6" />,
      title: 'Boucles d&apos;Oreilles',
      description: 'Placement automatique avec détection des oreilles et rendu PBR materials réaliste.',
    },
    {
      icon: <Smartphone className="w-6 h-6" />,
      title: 'AR Mobile Natif',
      description: 'Export USDZ (iOS AR Quick Look) et GLB (Android Scene Viewer) avec 1-tap experience.',
    },
    {
      icon: <Eye className="w-6 h-6" />,
      title: 'Snapshots HD',
      description: 'Capture photo/vidéo de l&apos;essayage en 4K, partage sur réseaux sociaux intégré.',
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: 'Performance 60 FPS',
      description: 'Optimisé GPU avec WebGL pour tracking et rendu fluide même sur mobile bas de gamme.',
    },
    {
      icon: <Share2 className="w-6 h-6" />,
      title: 'Partage Social',
      description: 'Export direct Instagram, Facebook, TikTok avec hashtags et branding personnalisé.',
    },
  ];

  const benefits = [
    {
      title: 'Performance',
      description: 'Tracking temps réel',
      stat: '60 FPS',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      title: 'Précision',
      description: 'Points de tracking',
      stat: '468+21',
      color: 'from-purple-500 to-pink-500',
    },
    {
      title: 'Conversion',
      description: 'Taux augmentation',
      stat: '+40%',
      color: 'from-orange-500 to-red-500',
    },
    {
      title: 'Retours',
      description: 'Réduction',
      stat: '-60%',
      color: 'from-green-500 to-teal-500',
    },
  ];

  const categories = [
    {
      title: 'Lunettes',
      description: 'Solaires, vue, sport',
      icon: '🕶️',
      models: '1000+',
      tracking: 'Face Mesh 468 points',
      features: ['Ajustement auto nez/oreilles', 'Reflets réalistes', 'Essai couleurs multiple'],
    },
    {
      title: 'Montres',
      description: 'Luxe, sport, connectées',
      icon: '⌚',
      models: '500+',
      tracking: 'Hand Tracking 21 points',
      features: ['Taille poignet auto', 'Bracelet adaptable', 'Vue 360° interactive'],
    },
    {
      title: 'Bijoux',
      description: 'Bagues, colliers, boucles',
      icon: '💍',
      models: '800+',
      tracking: 'Face + Hand tracking',
      features: ['Détection oreilles/doigts', 'Matériaux PBR', 'Brillance réaliste'],
    },
    {
      title: 'Accessoires',
      description: 'Casques, chapeaux, sacs',
      icon: '🎩',
      models: '300+',
      tracking: 'Face Mesh full 3D',
      features: ['Ajustement taille tête', 'Gravité/physique', 'Textures HD'],
    },
  ];

  const techStack = [
    { 
      name: 'MediaPipe Face Mesh', 
      description: '468 landmarks faciaux en temps réel',
      version: 'v0.5'
    },
    { 
      name: 'MediaPipe Hands', 
      description: '21 landmarks main avec détection précise',
      version: 'v0.4'
    },
    { 
      name: 'Three.js', 
      description: 'Rendu 3D overlay avec PBR materials',
      version: 'r160'
    },
    { 
      name: 'WebGL 2.0', 
      description: 'Accélération GPU pour 60 FPS constant',
      version: '2.0'
    },
    { 
      name: 'USDZ/GLB Export', 
      description: 'AR iOS Quick Look et Android Scene Viewer',
      version: 'Native'
    },
    { 
      name: 'WebXR API', 
      description: 'AR navigateur sans app (Chrome, Edge, Safari)',
      version: '1.0'
    },
  ];

  const stats = [
    { label: 'Conversion', value: '+40%', description: 'Augmentation taux achat' },
    { label: 'Engagement', value: 'x3', description: 'Temps sur site' },
    { label: 'Retours', value: '-60%', description: 'Réduction retours produits' },
    { label: 'Satisfaction', value: '95%', description: 'Clients satisfaits' },
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '29',
      views: 'Illimitées',
      products: '50',
      features: ['Face tracking', 'Export photos', 'Support email', 'Branding Luneo'],
    },
    {
      name: 'Pro',
      price: '79',
      views: 'Illimitées',
      products: '500',
      features: ['Tout Starter +', 'Hand tracking', 'Export AR (USDZ/GLB)', 'Webhooks', 'Analytics avancées', 'Support prioritaire'],
      popular: true,
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      views: 'Illimitées',
      products: 'Illimité',
      features: ['Tout Pro +', 'White-label complet', 'CDN privé', 'SLA 99.99%', 'Custom features', 'Account manager dédié'],
    },
  ];

  // Demo handlers
  const handleStartDemo = async (category: string) => {
    try {
      setStreamError(null);
      setSelectedCategory(category);
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
        category: selectedCategory,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      setStreamError("Impossible d'accéder à votre caméra. Vérifiez les permissions.");
      setCameraActive(false);
      mediaStreamRef.current = null;
    }
  };

  const handleStopDemo = () => {
    setCameraActive(false);
    setSelectedCategory(null);
    setStreamError(null);
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
  };

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && recording) {
        mediaRecorderRef.current.stop();
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, [recording]);

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 1280;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const link = document.createElement('a');
    link.download = `try-on-${selectedCategory ?? 'capture'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const toggleVideoRecording = () => {
    if (!mediaStreamRef.current) return;
    if (!recording) {
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
        link.download = `try-on-${selectedCategory ?? 'demo'}.webm`;
        link.click();
        URL.revokeObjectURL(url);
        setRecordedChunks([]);
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      setRecording(false);
    }
  };

  const shareDemo = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Luneo Virtual Try-On',
          text: "Je viens de tester l'essayage virtuel Luneo 🤩",
          url: typeof window !== 'undefined' ? window.location.href : 'https://app.luneo.app/solutions/virtual-try-on',
        });
      } catch (error) {
        logger.warn('Share cancelled', {
          error,
          message: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    } else {
      alert('Le partage natif est indisponible sur ce navigateur.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(6,182,212,0.1),transparent_50%)]" />
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 50%, rgba(59, 130, 246, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.15) 0%, transparent 50%)',
                'radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.15) 0%, transparent 50%)',
              ],
            }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-400">AI-Powered Virtual Try-On</span>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
              Essayage Virtuel
              <br />
              Hyper-Réaliste
            </h1>

            <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
              Permettez à vos clients d&apos;essayer lunettes, montres, bijoux en temps réel avec AR.
              <br className="hidden sm:block" />
              <span className="text-cyan-400 font-semibold">Tracking 468 points</span> du visage et{' '}
              <span className="text-blue-400 font-semibold">21 points</span> de la main.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-8 sm:mb-12">
              <Link href="/demo/virtual-try-on" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg group w-full sm:w-auto"
                >
                  <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Essayer Maintenant</span>
                  <span className="sm:hidden">Essayer</span>
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cyan-500/50 hover:bg-cyan-500/10 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
                >
                  Commencer Gratuitement
                </Button>
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-4xl mx-auto">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  className="text-center"
                >
                  <div className={`text-3xl sm:text-4xl font-bold bg-gradient-to-r ${benefit.color} bg-clip-text text-transparent mb-2`}>
                    {benefit.stat}
                  </div>
                  <div className="text-sm font-semibold text-white mb-1">{benefit.title}</div>
                  <div className="text-xs text-gray-400">{benefit.description}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Essayez en Direct
            </h2>
            <p className="text-xl text-gray-300">
              Activez votre caméra et testez l&apos;essayage virtuel immédiatement
            </p>
          </motion.div>

          {/* Demo Panel */}
          <Card className="bg-gray-900/50 border-cyan-500/20 p-8 backdrop-blur-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Camera Preview */}
              <div className="space-y-6">
                <div className="aspect-video bg-black/50 rounded-lg border-2 border-cyan-500/30 flex items-center justify-center relative overflow-hidden">
                  {cameraActive ? (
                    <>
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        playsInline
                        muted
                      />
                      <div className="absolute inset-0 pointer-events-none">
                        <motion.div
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 4, repeat: Infinity }}
                          className="absolute inset-0 border-4 border-cyan-500/30 rounded-lg"
                        />
                      </div>
                      <div className="absolute bottom-4 left-4 bg-cyan-500/20 backdrop-blur-sm border border-cyan-500/30 px-4 py-2 rounded-lg">
                        <p className="text-sm text-cyan-400 font-medium">
                          Tracking actif&nbsp;: {selectedCategory}
                        </p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-8">
                      <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400 mb-2">Caméra désactivée</p>
                      <p className="text-sm text-gray-500">
                        Sélectionnez une catégorie pour démarrer
                      </p>
                    </div>
                  )}
                </div>
                {streamError && (
                  <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
                    {streamError}
                  </div>
                )}

                {cameraActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <Button
                        variant="outline"
                        className="border-cyan-500/50 hover:bg-cyan-500/10"
                        onClick={capturePhoto}
                      >
                        <Download className="mr-2 w-4 h-4" />
                        Photo
                      </Button>
                      <Button
                        variant="outline"
                        className="border-blue-500/50 hover:bg-blue-500/10"
                        onClick={toggleVideoRecording}
                      >
                        <Video className="mr-2 w-4 h-4" />
                        {recording ? 'Stop' : 'Vidéo'}
                      </Button>
                      <Button
                        variant="outline"
                        className="border-purple-500/50 hover:bg-purple-500/10"
                        onClick={shareDemo}
                      >
                        <Share2 className="mr-2 w-4 h-4" />
                        Partager
                      </Button>
                    </div>
                    <Button
                      onClick={handleStopDemo}
                      variant="destructive"
                      className="w-full"
                    >
                      Arrêter la caméra
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Categories Selection */}
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Glasses className="w-6 h-6 text-cyan-400" />
                  Choisissez une Catégorie
                </h3>

                <div className="space-y-3">
                  {categories.slice(0, 4).map((category, index) => (
                    <Card
                      key={index}
                      className={`p-4 cursor-pointer transition-all ${
                        selectedCategory === category.title
                          ? 'bg-cyan-500/20 border-cyan-500'
                          : 'bg-gray-800/50 border-gray-700 hover:border-cyan-500/50 hover:bg-gray-800/70'
                      }`}
                      onClick={() => handleStartDemo(category.title)}
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-4xl">{category.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-white mb-1">
                            {category.title}
                          </h4>
                          <p className="text-sm text-gray-400">
                            {category.description}
                          </p>
                          <p className="text-xs text-cyan-400 mt-1">
                            {category.models} modèles · {category.tracking}
                          </p>
                        </div>
                        {selectedCategory === category.title && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <CheckCircle className="w-6 h-6 text-cyan-400" />
                          </motion.div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                  <p className="text-sm text-blue-400 flex items-start gap-2">
                    <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Démo interactive:</strong> Sélectionnez une catégorie pour activer 
                      votre caméra et voir le tracking en temps réel. Aucune installation requise !
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Technologie AR de Pointe
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              MediaPipe + Three.js + WebGL pour un réalisme maximal et une performance 60 FPS
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-cyan-500/20 p-6 h-full hover:border-cyan-500/50 hover:bg-gray-900/70 transition-all group">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <div className="text-cyan-400">{feature.icon}</div>
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white">
                    {feature.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Deep Dive */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Catégories Supportées
            </h2>
            <p className="text-xl text-gray-300">
              Essayage AR pour tous types de produits avec précision professionnelle
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {categories.map((category, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-cyan-500/20 p-8 hover:border-cyan-500/50 transition-all">
                  <div className="flex items-start gap-6 mb-6">
                    <div className="text-6xl">{category.icon}</div>
                    <div>
                      <h3 className="text-2xl font-bold mb-2 text-white">
                        {category.title}
                      </h3>
                      <p className="text-gray-400 mb-2">{category.description}</p>
                      <p className="text-sm text-cyan-400 font-semibold">
                        {category.models} modèles · {category.tracking}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-gray-400 mb-3">
                      Features Avancées:
                    </h4>
                    {category.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-300">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handleStartDemo(category.title)}
                    className="w-full mt-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                  >
                    <Play className="mr-2 w-4 h-4" />
                    Tester {category.title}
                  </Button>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Stack Technique
            </h2>
            <p className="text-xl text-gray-300">
              Technologies de pointe pour une expérience AR sans compromis
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="bg-gray-900/50 border-blue-500/20 p-6 h-full">
                  <div className="flex items-start gap-3 mb-4">
                    <Cpu className="w-6 h-6 text-blue-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-white mb-1">
                        {tech.name}
                      </h3>
                      <span className="text-xs text-blue-400 font-mono">
                        {tech.version}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {tech.description}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Tech Diagram */}
          <div className="mt-12">
            <Card className="bg-gray-900/50 border-blue-500/20 p-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <Camera className="w-8 h-8 text-cyan-400" />
                  </div>
                  <p className="font-semibold text-white">Camera Input</p>
                  <p className="text-xs text-gray-400">WebRTC Stream</p>
                </div>

                <ArrowRight className="w-8 h-8 text-gray-600 rotate-90 md:rotate-0" />

                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <Cpu className="w-8 h-8 text-purple-400" />
                  </div>
                  <p className="font-semibold text-white">AI Tracking</p>
                  <p className="text-xs text-gray-400">MediaPipe 468+21</p>
                </div>

                <ArrowRight className="w-8 h-8 text-gray-600 rotate-90 md:rotate-0" />

                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <Sparkles className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="font-semibold text-white">3D Rendering</p>
                  <p className="text-xs text-gray-400">Three.js + WebGL</p>
                </div>

                <ArrowRight className="w-8 h-8 text-gray-600 rotate-90 md:rotate-0" />

                <div className="text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-3 mx-auto">
                    <Eye className="w-8 h-8 text-green-400" />
                  </div>
                  <p className="font-semibold text-white">Display</p>
                  <p className="text-xs text-gray-400">60 FPS Real-time</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Impact Mesurable
            </h2>
            <p className="text-xl text-gray-300">
              Résultats prouvés par des centaines de marques e-commerce
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-lg font-semibold text-white mb-1">
                  {stat.label}
                </div>
                <div className="text-sm text-gray-400">{stat.description}</div>
              </motion.div>
            ))}
          </div>

          <Card className="bg-gradient-to-br from-cyan-900/20 to-blue-900/20 border-cyan-500/30 p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-green-400" />
                  Augmentation Conversions
                </h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Clients 3x plus engagés avec essayage AR</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Panier moyen +25% avec visualisation produit</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Taux abandon panier -30%</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-400" />
                  Réduction Retours
                </h3>
                <ul className="space-y-3 text-sm text-gray-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Clients achètent la bonne taille du premier coup</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Retours produits -60% (lunettes/montres)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <span>Économie logistique ~15k€/mois</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Luneo vs Zakeke
            </h2>
            <p className="text-xl text-gray-300">
              Pourquoi notre Virtual Try-On est supérieur
            </p>
          </motion.div>

          <Card className="bg-gray-900/50 border-cyan-500/20 p-8 overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="pb-4 text-gray-400 font-semibold">Feature</th>
                  <th className="pb-4 text-gray-400 font-semibold">Zakeke VTO</th>
                  <th className="pb-4 text-cyan-400 font-semibold">Luneo VTO</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Tracking Facial</td>
                  <td className="py-4 text-gray-400">AI basique (non spécifié)</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ MediaPipe 468 points
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Tracking Main</td>
                  <td className="py-4 text-gray-400">Non mentionné</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ MediaPipe 21 points
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Catégories</td>
                  <td className="py-4 text-gray-400">6 catégories</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ 8 catégories (+ écharpes, chapeaux)
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Export AR</td>
                  <td className="py-4 text-gray-400">QR codes basiques</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ USDZ + GLB + WebXR natifs
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Performance</td>
                  <td className="py-4 text-gray-400">Non spécifié</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ 60 FPS garanti (WebGL)
                  </td>
                </tr>
                <tr className="border-b border-gray-800">
                  <td className="py-4 text-gray-300">Vues mensuelles</td>
                  <td className="py-4 text-gray-400">500-5000 (payant)</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ Illimité (tous plans)
                  </td>
                </tr>
                <tr>
                  <td className="py-4 text-gray-300">Prix (Pro)</td>
                  <td className="py-4 text-gray-400">120$/mois (2500 vues)</td>
                  <td className="py-4 text-white font-semibold">
                    ✅ 79$/mois (vues illimitées)
                  </td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Tarifs Transparents
            </h2>
            <p className="text-xl text-gray-300">
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
                  className={`p-8 h-full ${
                    plan.popular
                      ? 'bg-gradient-to-b from-cyan-900/30 to-blue-900/30 border-cyan-500'
                      : 'bg-gray-900/50 border-gray-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="inline-block px-3 py-1 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-full text-xs font-semibold mb-4">
                      POPULAIRE
                    </div>
                  )}
                  <h3 className="text-2xl font-bold mb-2 text-white">
                    {plan.name}
                  </h3>
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-white">
                      {plan.price === 'Custom' ? '' : '$'}
                      {plan.price}
                    </span>
                    {plan.price !== 'Custom' && (
                      <span className="text-gray-400">/mois</span>
                    )}
                  </div>
                  <div className="space-y-2 mb-6 text-sm">
                    <p className="text-gray-300">
                      <span className="font-semibold text-white">
                        {plan.views}
                      </span>{' '}
                      vues AR
                    </p>
                    <p className="text-gray-300">
                      <span className="font-semibold text-white">
                        {plan.products}
                      </span>{' '}
                      produits
                    </p>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.price === 'Custom' ? '/contact' : '/auth/register'}>
                    <Button
                      className={`w-full ${
                        plan.popular
                          ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700'
                          : 'bg-gray-800 hover:bg-gray-700 border border-gray-700'
                      }`}
                    >
                      {plan.price === 'Custom' ? 'Contactez-nous' : 'Commencer'}
                    </Button>
                  </Link>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">
              Intégration Simple
            </h2>
            <p className="text-xl text-gray-300">
              Ajoutez le Virtual Try-On à votre site en 5 minutes
            </p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-gray-900/50 border-cyan-500/20 p-8">
              <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <Zap className="w-6 h-6 text-cyan-400" />
                Code Snippet
              </h3>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                <pre>{`import { VirtualTryOn } from '@luneo/virtual-try-on';

// Initialize
const tryOn = new VirtualTryOn({
  apiKey: 'your_api_key',
  category: 'glasses'
});

// Start camera
await tryOn.startCamera();

// Load 3D model
await tryOn.loadModel('/models/sunglasses.glb');

// Enable tracking
tryOn.enableTracking();

// Export AR
const usdz = await tryOn.exportUSdZ();
const glb = await tryOn.exportGLB();`}</pre>
              </div>
            </Card>

            <Card className="bg-gray-900/50 border-blue-500/20 p-8">
              <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-400" />
                Iframe Embed
              </h3>
              <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                <pre>{`<!-- Simple iframe embed -->
<iframe
  src="https://app.luneo.app/try-on?product=123"
  width="100%"
  height="600"
  allow="camera"
  frameborder="0"
></iframe>

<!-- Ou bouton trigger -->
<button
  data-luneo-try-on="glasses"
  data-model-url="/sunglasses.glb"
>
  Essayer virtuellement
</button>

<script src="https://cdn.luneo.app/try-on.js"></script>`}</pre>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-black via-cyan-900/20 to-black">
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
            <p className="text-xl text-gray-300 mb-8">
              Rejoignez les marques qui utilisent le Virtual Try-On pour
              augmenter conversions et réduire retours.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link href="/demo/virtual-try-on" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg group w-full sm:w-auto"
                >
                  <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Essayer la Démo</span>
                  <span className="sm:hidden">Démo</span>
                  <ArrowRight className="ml-2 w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/contact" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-cyan-500/50 hover:bg-cyan-500/10 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg w-full sm:w-auto"
                >
                  Parler à un Expert
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 lg:px-8 bg-black/50">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Questions Fréquentes
            </h2>
          </motion.div>

          <div className="space-y-4">
            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Comment fonctionne le tracking facial ?
              </h3>
              <p className="text-gray-400">
                Nous utilisons MediaPipe Face Mesh de Google pour détecter 468 points de repère sur votre visage 
                en temps réel. Cela permet un ajustement ultra-précis des lunettes, boucles d&apos;oreilles, et accessoires.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Mes clients doivent-ils installer une app ?
              </h3>
              <p className="text-gray-400">
                Non ! Tout fonctionne directement dans le navigateur (Chrome, Safari, Edge). Pour l&apos;AR mobile, 
                nous exportons en USDZ (iOS) et GLB (Android) pour AR Quick Look et Scene Viewer natifs.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Quelle est la performance sur mobile ?
              </h3>
              <p className="text-gray-400">
                Optimisé pour 60 FPS même sur mobile bas de gamme grâce à WebGL et LODs adaptatifs. 
                Fonctionne sur iPhone 8+ et Android 2019+.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Puis-je personnaliser le branding ?
              </h3>
              <p className="text-gray-400">
                Oui ! White-label complet sur plan Enterprise: couleurs, logo, domaine personnalisé, 
                et même suppression complète du branding Luneo.
              </p>
            </Card>

            <Card className="bg-gray-900/50 border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Comment obtenir mes modèles 3D ?
              </h3>
              <p className="text-gray-400">
                Uploadez vos modèles GLB/FBX existants, ou utilisez notre service de création 3D à partir 
                de photos produits (2-3 jours, à partir de 50€/modèle).
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-900/20 via-blue-900/20 to-cyan-900/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 text-white">
            Démarrez en 30 Secondes
          </h2>
          <p className="text-gray-300 mb-6">
            Aucune carte de crédit requise · Essai gratuit 14 jours · Annulez quand vous voulez
          </p>
          <Link href="/auth/register">
            <Button
              size="lg"
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-4"
            >
              Créer un Compte Gratuit
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
