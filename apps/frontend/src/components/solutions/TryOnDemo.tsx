'use client';

import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Camera,
  Video,
  Download,
  Share2,
  X,
  Glasses,
  Watch,
  Gem,
  Sparkles,
  Play,
  Pause,
  RotateCw,
  AlertCircle,
  CheckCircle,
  Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { logger } from '@/lib/logger';

interface TryOnDemoProps {
  category?: 'glasses' | 'watch' | 'jewelry' | 'all';
  modelUrl?: string;
  showControls?: boolean;
  onPhotoTaken?: (blob: Blob) => void;
}

interface TrackedPoint {
  x: number;
  y: number;
  z: number;
  confidence: number;
}

function TryOnDemo({
  category = 'all',
  modelUrl,
  showControls = true,
  onPhotoTaken,
}: TryOnDemoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(category === 'all' ? 'glasses' : category);
  const [isTracking, setIsTracking] = useState(false);
  const [facePoints, setFacePoints] = useState<TrackedPoint[]>([]);
  const [handPoints, setHandPoints] = useState<TrackedPoint[]>([]);
  const [fps, setFps] = useState(0);
  const [isRecording, setIsRecording] = useState(false);

  const categories = [
    { id: 'glasses', name: 'Lunettes', icon: Glasses, color: 'cyan' },
    { id: 'watch', name: 'Montres', icon: Watch, color: 'blue' },
    { id: 'jewelry', name: 'Bijoux', icon: Gem, color: 'purple' },
  ];

  // Initialize camera
  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      setIsActive(true);
      setIsLoading(false);

      // Simulate tracking initialization
      setTimeout(() => {
        setIsTracking(true);
        simulateTracking();
      }, 1000);
    } catch (err) {
      logger.error('Camera error', {
        error: err,
        category,
        message: err instanceof Error ? err.message : 'Unknown error',
      });
      setError(
        'Impossible d\'accéder à la caméra. Vérifiez les permissions de votre navigateur.'
      );
      setIsLoading(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsActive(false);
    setIsTracking(false);
    setFacePoints([]);
    setHandPoints([]);
  };

  // Simulate MediaPipe tracking (real implementation would use @mediapipe/face_mesh and @mediapipe/hands)
  const simulateTracking = () => {
    const interval = setInterval(() => {
      if (!isActive) {
        clearInterval(interval);
        return;
      }

      // Simulate 468 face landmarks
      const face: TrackedPoint[] = Array.from({ length: 468 }, () => ({
        x: Math.random() * 640,
        y: Math.random() * 480,
        z: Math.random() * 100 - 50,
        confidence: 0.8 + Math.random() * 0.2,
      }));

      // Simulate 21 hand landmarks
      const hand: TrackedPoint[] = Array.from({ length: 21 }, () => ({
        x: Math.random() * 640,
        y: Math.random() * 480,
        z: Math.random() * 100 - 50,
        confidence: 0.7 + Math.random() * 0.3,
      }));

      setFacePoints(face);
      setHandPoints(hand);

      // Simulate FPS
      setFps(Math.floor(55 + Math.random() * 10));

      // Draw overlay
      drawOverlay();
    }, 1000 / 60); // 60 FPS
  };

  // Draw 3D overlay on canvas
  const drawOverlay = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw tracking points (simplified - real implementation would draw 3D overlay)
    if (selectedCategory === 'glasses' && facePoints.length > 0) {
      // Draw glasses overlay simulation
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.strokeRect(
        canvas.width * 0.25,
        canvas.height * 0.3,
        canvas.width * 0.5,
        canvas.height * 0.15
      );
    }

    if (selectedCategory === 'watch' && handPoints.length > 0) {
      // Draw watch overlay simulation
      ctx.fillStyle = 'rgba(59, 130, 246, 0.3)';
      ctx.fillRect(
        canvas.width * 0.6,
        canvas.height * 0.5,
        canvas.width * 0.15,
        canvas.height * 0.1
      );
    }
  };

  // Take photo
  const takePhoto = () => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(videoRef.current, 0, 0);

    // Draw overlay
    if (canvasRef.current) {
      ctx.drawImage(canvasRef.current, 0, 0);
    }

    // Convert to blob
    canvas.toBlob((blob) => {
      if (blob && onPhotoTaken) {
        onPhotoTaken(blob);
      }

      // Download
      const url = URL.createObjectURL(blob!);
      const a = document.createElement('a');
      a.href = url;
      a.download = `luneo-tryon-${Date.now()}.png`;
      a.click();
    }, 'image/png');
  };

  // Toggle recording
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Real implementation would use MediaRecorder API
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="relative">
      <Card className="bg-gray-900/50 border-cyan-500/20 overflow-hidden">
        {/* Camera/Video Display */}
        <div className="relative aspect-video bg-black">
          {!isActive && !isLoading ? (
            // Camera Off State
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <Camera className="w-24 h-24 text-gray-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-white mb-3">
                  Essayage Virtuel AR
                </h3>
                <p className="text-gray-400 mb-6 max-w-md">
                  Activez votre caméra pour essayer des {selectedCategory === 'glasses' ? 'lunettes' : selectedCategory === 'watch' ? 'montres' : 'bijoux'} en temps réel
                </p>
                <Button
                  onClick={startCamera}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Activer la Caméra
                </Button>
              </motion.div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 max-w-md"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}
            </div>
          ) : isLoading ? (
            // Loading State
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader className="w-16 h-16 text-cyan-400 animate-spin mb-4" />
              <p className="text-white font-medium">Initialisation caméra...</p>
              <p className="text-sm text-gray-400 mt-2">
                Autorisez l&apos;accès caméra dans votre navigateur
              </p>
            </div>
          ) : (
            // Active Camera
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none"
              />

              {modelUrl && (
                <a
                  href={modelUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-4 left-4 max-w-[260px] truncate rounded-lg bg-black/60 px-3 py-1 text-xs text-white/80 backdrop-blur transition hover:bg-black/80"
                >
                  {modelUrl}
                </a>
              )}

              {/* Tracking Indicators */}
              {isTracking && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-4 left-4 space-y-2"
                >
                  <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm border border-cyan-500/30 px-4 py-2 rounded-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-white font-medium">
                      Tracking actif
                    </span>
                  </div>

                  {selectedCategory === 'glasses' && (
                    <div className="bg-black/60 backdrop-blur-sm border border-cyan-500/30 px-4 py-2 rounded-lg">
                      <p className="text-xs text-cyan-400">
                        Face: {facePoints.length} points
                      </p>
                    </div>
                  )}

                  {(selectedCategory === 'watch' || selectedCategory === 'jewelry') && (
                    <div className="bg-black/60 backdrop-blur-sm border border-blue-500/30 px-4 py-2 rounded-lg">
                      <p className="text-xs text-blue-400">
                        Hand: {handPoints.length} points
                      </p>
                    </div>
                  )}

                  <div className="bg-black/60 backdrop-blur-sm border border-green-500/30 px-4 py-2 rounded-lg">
                    <p className="text-xs text-green-400">
                      {fps} FPS
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Product Badge */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border border-cyan-500/30 px-4 py-2 rounded-lg">
                <p className="text-sm text-white font-medium">
                  {selectedCategory === 'glasses' ? '🕶️ Lunettes' : selectedCategory === 'watch' ? '⌚ Montre' : '💍 Bijoux'}
                </p>
              </div>

              {/* Recording Indicator */}
              {isRecording && (
                <motion.div
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/20 backdrop-blur-sm border border-red-500 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm text-white font-medium">REC</span>
                </motion.div>
              )}

              {/* Close Button */}
              <button
                onClick={stopCamera}
                className="absolute top-4 right-4 mt-12 w-10 h-10 bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        {isActive && showControls && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-gray-900/50 border-t border-gray-700"
          >
            {/* Category Selection */}
            <div className="mb-6">
              <h4 className="text-sm font-semibold text-gray-400 mb-3">
                Catégorie:
              </h4>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`p-3 rounded-lg border-2 transition-all flex items-center gap-2 ${
                      selectedCategory === cat.id
                        ? `border-${cat.color}-500 bg-${cat.color}-500/10`
                        : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
                    }`}
                  >
                    <cat.icon className={`w-5 h-5 text-${cat.color}-400`} />
                    <span className="text-white text-sm font-medium">
                      {cat.name}
                    </span>
                    {selectedCategory === cat.id && (
                      <CheckCircle className="w-4 h-4 text-cyan-400 ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Button
                onClick={takePhoto}
                variant="outline"
                className="border-cyan-500/50 hover:bg-cyan-500/10"
              >
                <Download className="mr-2 w-4 h-4" />
                Photo
              </Button>

              <Button
                onClick={toggleRecording}
                variant="outline"
                className={`${
                  isRecording
                    ? 'border-red-500/50 hover:bg-red-500/10'
                    : 'border-blue-500/50 hover:bg-blue-500/10'
                }`}
              >
                {isRecording ? (
                  <>
                    <Pause className="mr-2 w-4 h-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Video className="mr-2 w-4 h-4" />
                    Vidéo
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="border-purple-500/50 hover:bg-purple-500/10"
              >
                <Share2 className="mr-2 w-4 h-4" />
                Partager
              </Button>

              <Button
                variant="outline"
                className="border-pink-500/50 hover:bg-pink-500/10"
              >
                <Sparkles className="mr-2 w-4 h-4" />
                AR Export
              </Button>
            </div>

            {/* Stats Bar */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-cyan-400">{facePoints.length}</p>
                <p className="text-xs text-gray-400">Face Points</p>
              </div>
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-blue-400">{handPoints.length}</p>
                <p className="text-xs text-gray-400">Hand Points</p>
              </div>
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-green-400">{fps}</p>
                <p className="text-xs text-gray-400">FPS</p>
              </div>
              <div className="p-3 bg-gray-800/50 border border-gray-700 rounded-lg">
                <p className="text-2xl font-bold text-purple-400">
                  {isTracking ? 'ON' : 'OFF'}
                </p>
                <p className="text-xs text-gray-400">Tracking</p>
              </div>
            </div>

            {/* Info */}
            <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p className="text-sm text-blue-400 flex items-start gap-2">
                <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>
                  <strong>Démo interactive:</strong> Le tracking réel utilise MediaPipe pour 
                  détecter 468 points du visage et 21 points de la main en temps réel à 60 FPS.
                  Les modèles 3D sont rendus avec Three.js et WebGL.
                </span>
              </p>
            </div>
          </motion.div>
        )}

        {/* Bottom Info */}
        {!isActive && !isLoading && (
          <div className="p-6 bg-gray-900/30 border-t border-gray-700">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-cyan-400 mb-1">468</div>
                <p className="text-xs text-gray-400">Points Faciaux</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400 mb-1">21</div>
                <p className="text-xs text-gray-400">Points Main</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-400 mb-1">60</div>
                <p className="text-xs text-gray-400">FPS Target</p>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tech Stack Info */}
      {!isActive && (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="bg-gray-900/50 border-cyan-500/20 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                <Camera className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">MediaPipe</h4>
                <p className="text-xs text-gray-400">Face Mesh v0.5</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              468 landmarks faciaux pour tracking ultra-précis
            </p>
          </Card>

          <Card className="bg-gray-900/50 border-blue-500/20 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Three.js</h4>
                <p className="text-xs text-gray-400">r160 + WebGL</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Rendu 3D overlay avec PBR materials réalistes
            </p>
          </Card>

          <Card className="bg-gray-900/50 border-purple-500/20 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <RotateCw className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-semibold text-white text-sm">Real-time</h4>
                <p className="text-xs text-gray-400">60 FPS</p>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Performance optimisée GPU pour fluidité maximale
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
export default memo(TryOnDemo);

