'use client';

import React, { useState, useEffect, useRef, memo, useCallback, useMemo } from 'react';
import { LazyMotionDiv as motion } from '@/lib/performance/dynamic-motion';
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
let FaceMesh: any = null;
let Hands: any = null;
let CameraUtils: any = null;

if (typeof window !== 'undefined') {
  try {
    FaceMesh = require('@mediapipe/face_mesh').FaceMesh;
  } catch { /* optional dep */ }
  try {
    Hands = require('@mediapipe/hands').Hands;
  } catch { /* optional dep */ }
  try {
    CameraUtils = require('@mediapipe/camera_utils').Camera;
  } catch { /* optional dep */ }
}
import { ARErrorBoundary } from '@/components/ErrorBoundary';
import { drawGlassesOverlay, drawWatchOverlay, clearCanvas } from '@/lib/utils/overlay-renderer';
import { useI18n } from '@/i18n/useI18n';

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

/** MediaPipe face mesh / hands result shape */
interface FaceMeshResult {
  multiFaceLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
}

interface HandsResult {
  multiHandLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
}

function TryOnDemo({
  category = 'all',
  modelUrl,
  showControls = true,
  onPhotoTaken,
}: TryOnDemoProps) {
  const { t } = useI18n();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const faceMeshRef = useRef<InstanceType<typeof FaceMesh> | null>(null);
  const handsRef = useRef<InstanceType<typeof Hands> | null>(null);
  const cameraRef = useRef<InstanceType<typeof CameraUtils> | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const fpsCounterRef = useRef<number[]>([]);
  
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

  // Draw face overlay (utilise utilitaire overlay-renderer)
  const drawFaceOverlay = useCallback((results: FaceMeshResult) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size to match video exactly
    const videoWidth = videoRef.current.videoWidth || 640;
    const videoHeight = videoRef.current.videoHeight || 480;
    
    if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
      canvas.width = videoWidth;
      canvas.height = videoHeight;
    }

    // Clear canvas using utility
    clearCanvas(ctx, canvas.width, canvas.height);

    // Draw face mesh for glasses using utility
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0 && selectedCategory === 'glasses') {
      const landmarks = results.multiFaceLandmarks[0];
      
      if (landmarks.length >= 468) {
        // Convert landmarks to overlay points format
        const overlayPoints = landmarks.map((landmark: { x: number; y: number; z: number }) => ({
          x: landmark.x * canvas.width,
          y: landmark.y * canvas.height,
        }));

        // Draw glasses overlay using utility
        drawGlassesOverlay(ctx, overlayPoints, {
          color: '#06b6d4',
          lineWidth: 6,
          fill: true,
          fillOpacity: 0.25,
        });
      }
    }
  }, [selectedCategory]);

  // Draw hand overlay (utilise utilitaire overlay-renderer)
  const drawHandOverlay = useCallback((results: HandsResult) => {
    if (!canvasRef.current || !videoRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw watch/jewelry overlay for hands using utility
    if (results.multiHandLandmarks && (selectedCategory === 'watch' || selectedCategory === 'jewelry')) {
      const landmarks = results.multiHandLandmarks[0];
      
      if (landmarks.length >= 21) {
        // Convert landmarks to overlay points format
        const wristPoints = [
          {
            x: landmarks[0].x * canvas.width,
            y: landmarks[0].y * canvas.height,
            z: landmarks[0].z * 100,
          },
        ];

        if (selectedCategory === 'watch') {
          drawWatchOverlay(ctx, wristPoints, {
            color: '#3B82F6',
            lineWidth: 4,
            fill: true,
            fillOpacity: 0.2,
          });
        }
      }
    }
  }, [selectedCategory]);

  // Initialize MediaPipe Face Mesh
  const initializeFaceMesh = useCallback(() => {
    if (faceMeshRef.current) return;

    try {
      const faceMesh = new FaceMesh({
        locateFile: (file: any) => {
          // Use CDN for MediaPipe files (works in both dev and production)
          // MediaPipe needs specific file paths that are available on CDN
          return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
        },
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });

      faceMesh.onResults((results: any) => {
        try {
          if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
            const landmarks = results.multiFaceLandmarks[0];
            const points: TrackedPoint[] = landmarks.map((landmark: any) => ({
              x: landmark.x * (canvasRef.current?.width || 640),
              y: landmark.y * (canvasRef.current?.height || 480),
              z: landmark.z * 100,
              confidence: 0.9,
            }));
            setFacePoints(points);
            setIsTracking(true);
            // Call drawFaceOverlay directly - it's defined above
            if (canvasRef.current && videoRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                const videoWidth = videoRef.current.videoWidth || 640;
                const videoHeight = videoRef.current.videoHeight || 480;
                if (canvas.width !== videoWidth || canvas.height !== videoHeight) {
                  canvas.width = videoWidth;
                  canvas.height = videoHeight;
                }
                clearCanvas(ctx, canvas.width, canvas.height);
                if (selectedCategory === 'glasses' && landmarks.length >= 468) {
                  const overlayPoints = landmarks.map((landmark: { x: number; y: number; z: number }) => ({
                    x: landmark.x * canvas.width,
                    y: landmark.y * canvas.height,
                  }));
                  drawGlassesOverlay(ctx, overlayPoints, {
                    color: '#06b6d4',
                    lineWidth: 6,
                    fill: true,
                    fillOpacity: 0.25,
                  });
                }
              }
            }
          } else {
            setFacePoints([]);
            setIsTracking(false);
          }
        } catch (err) {
          logger.error('FaceMesh results processing error', { error: err });
        }
      });

      faceMeshRef.current = faceMesh;
      logger.info('FaceMesh initialized successfully');
    } catch (err) {
      logger.error('FaceMesh initialization error', { error: err });
      setError(t('common.trackingErrorRefresh'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory]);

  // Initialize MediaPipe Hands
  const initializeHands = useCallback(() => {
    if (handsRef.current) return;

    try {
      const hands = new Hands({
        locateFile: (file: any) => {
          // Use CDN for MediaPipe files (works in both dev and production)
          // MediaPipe needs specific file paths that are available on CDN
          return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
        },
      });

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.3,
        minTrackingConfidence: 0.3,
      });

      hands.onResults((results: any) => {
        try {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const points: TrackedPoint[] = landmarks.map((landmark: any) => ({
              x: landmark.x * (canvasRef.current?.width || 640),
              y: landmark.y * (canvasRef.current?.height || 480),
              z: landmark.z * 100,
              confidence: 0.8,
            }));
            setHandPoints(points);
            drawHandOverlay(results);
          } else {
            setHandPoints([]);
          }
        } catch (err) {
          logger.error('Hands results processing error', { error: err });
        }
      });

      handsRef.current = hands;
      logger.info('Hands initialized successfully');
    } catch (err) {
      logger.error('Hands initialization error', { error: err });
      setError(t('common.trackingErrorRefresh'));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drawHandOverlay]);

  // Calculate FPS
  const calculateFPS = useCallback(() => {
    const now = performance.now();
    const delta = now - lastFrameTimeRef.current;
    lastFrameTimeRef.current = now;
    
    if (delta > 0) {
      const currentFPS = Math.round(1000 / delta);
      fpsCounterRef.current.push(currentFPS);
      if (fpsCounterRef.current.length > 30) {
        fpsCounterRef.current.shift();
      }
      const avgFPS = Math.round(
        fpsCounterRef.current.reduce((a, b) => a + b, 0) / fpsCounterRef.current.length
      );
      setFps(avgFPS);
    }
  }, []);

  // Initialize camera
  const startCamera = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if MediaDevices API is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('MediaDevices API not available. Please use a modern browser with camera support.');
      }

      // Initialize MediaPipe first
      initializeFaceMesh();
      initializeHands();

      // Demo simulation - replace with real API in production. Wait for MediaPipe to initialize.
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if MediaPipe initialized correctly
      if (!faceMeshRef.current) {
        throw new Error('FaceMesh failed to initialize');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: false,
      });

      if (!videoRef.current) {
        stream.getTracks().forEach(track => track.stop());
        throw new Error('Video element not available');
      }

      videoRef.current.srcObject = stream;
      
      // Wait for video to be ready
      await new Promise((resolve, reject) => {
        if (!videoRef.current) {
          reject(new Error('Video element not available'));
          return;
        }
        
        const onLoadedMetadata = () => {
          videoRef.current?.removeEventListener('loadedmetadata', onLoadedMetadata);
          resolve(undefined);
        };
        
        const onError = () => {
          videoRef.current?.removeEventListener('error', onError);
          reject(new Error('Video failed to load'));
        };
        
        videoRef.current.addEventListener('loadedmetadata', onLoadedMetadata);
        videoRef.current.addEventListener('error', onError);
        
        videoRef.current.play().catch(reject);
      });

      setIsActive(true);
      setIsLoading(false);

      // Start MediaPipe camera processing
      if (videoRef.current && faceMeshRef.current) {
        try {
          const camera = new CameraUtils(videoRef.current, {
            onFrame: async () => {
              try {
                if (videoRef.current && faceMeshRef.current) {
                  await faceMeshRef.current.send({ image: videoRef.current });
                }
                if (videoRef.current && handsRef.current) {
                  await handsRef.current.send({ image: videoRef.current });
                }
                calculateFPS();
              } catch (frameErr) {
                logger.error('Frame processing error', { error: frameErr });
              }
            },
            width: typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 640 : 1280,
            height: typeof window !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? 480 : 720,
          });
          camera.start();
          cameraRef.current = camera;
          logger.info('Camera started successfully');
        } catch (cameraErr) {
          logger.error('Camera start error', { error: cameraErr });
          setError('Erreur lors du démarrage de la caméra MediaPipe.');
          setIsLoading(false);
        }
      }
    } catch (err) {
      logger.error('Camera error', {
        error: err,
        category,
        message: err instanceof Error ? err.message : 'Unknown error',
        name: err instanceof Error ? err.name : 'Unknown',
      });
      
      let errorMessage = 'Impossible d\'accéder à la caméra.';
      
      if (err instanceof Error) {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          errorMessage = isMobile
            ? 'Permission caméra refusée. Sur mobile, autorisez l\'accès caméra dans les paramètres de votre navigateur, puis rechargez la page.'
            : t('common.cameraPermissionDenied');
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          errorMessage = isMobile
            ? 'Aucune caméra trouvée. Sur mobile, cette fonctionnalité fonctionne mieux avec l\'application native. Essayez sur desktop pour une meilleure expérience.'
            : t('common.cameraNotFound');
        } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
          errorMessage = 'La caméra est déjà utilisée par une autre application.';
        } else {
          errorMessage = `Erreur: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      setIsLoading(false);
      setIsActive(false);
    }
  };

  // Stop camera
  const stopCamera = () => {
    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    setIsActive(false);
    setIsTracking(false);
    setFacePoints([]);
    setHandPoints([]);
    setFps(0);
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
  const toggleRecording = useCallback(() => {
    if (!isRecording) {
      // Start recording
      if (videoRef.current && canvasRef.current) {
        const stream = canvasRef.current.captureStream(30); // 30 FPS
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'video/webm;codecs=vp9',
        });

        const chunks: Blob[] = [];
        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunks.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `luneo-tryon-${Date.now()}.webm`;
          a.click();
          URL.revokeObjectURL(url);
        };

        mediaRecorder.start();
        (videoRef.current as HTMLVideoElement & { mediaRecorder?: MediaRecorder }).mediaRecorder = mediaRecorder;
        setIsRecording(true);
      }
    } else {
      // Stop recording
      const videoEl = videoRef.current as (HTMLVideoElement & { mediaRecorder?: MediaRecorder | null }) | null;
      if (videoEl?.mediaRecorder) {
        const mediaRecorder = videoEl.mediaRecorder;
        mediaRecorder.stop();
        videoEl.mediaRecorder = null;
        setIsRecording(false);
      }
    }
  }, [isRecording]);

  // Share photo/video
  const shareContent = useCallback(async () => {
    if (!canvasRef.current || !videoRef.current) return;

    try {
      if (navigator.share) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0);
          if (canvasRef.current) {
            ctx.drawImage(canvasRef.current, 0, 0);
          }
          canvas.toBlob(async (blob) => {
            if (blob) {
              const file = new File([blob], `luneo-tryon-${Date.now()}.png`, { type: 'image/png' });
              await navigator.share({
                title: 'Luneo Virtual Try-On',
                text: 'Regardez mon essai virtuel !',
                files: [file],
              });
            }
          });
        }
      } else {
        // Fallback: copy to clipboard or download
        takePhoto();
      }
    } catch (error) {
      logger.error('Share error', { error });
      takePhoto(); // Fallback to download
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup on unmount (amélioré)
  useEffect(() => {
    return () => {
      // Stop camera and cleanup streams
      stopCamera();
      
      // Cleanup MediaPipe Face Mesh
      if (faceMeshRef.current) {
        try {
          faceMeshRef.current.close();
        } catch (err) {
          logger.warn('Error closing FaceMesh', { error: err });
        }
        faceMeshRef.current = null;
      }
      
      // Cleanup MediaPipe Hands
      if (handsRef.current) {
        try {
          handsRef.current.close();
        } catch (err) {
          logger.warn('Error closing Hands', { error: err });
        }
        handsRef.current = null;
      }
      
      // Cleanup camera ref
      if (cameraRef.current) {
        try {
          cameraRef.current.stop();
        } catch (err) {
          logger.warn('Error stopping camera', { error: err });
        }
        cameraRef.current = null;
      }
      
      // Cleanup animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      
      // Cleanup video stream
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
        videoRef.current.srcObject = null;
      }
      
      // Reset state
      setIsActive(false);
      setIsTracking(false);
      setFacePoints([]);
      setHandPoints([]);
      setFps(0);
    };
  }, []);

  return (
    <ARErrorBoundary componentName="TryOnDemo">
    <div className="relative">
      <Card className="bg-gray-900/50 border-cyan-500/20 overflow-hidden">
        {/* Camera/Video Display */}
        <div className="relative aspect-video bg-black">
          {!isActive && !isLoading ? (
            // Camera Off State
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center">
              <motion
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
                {/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && (
                  <div className="mb-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <p className="text-xs text-yellow-400">
                      💡 Sur mobile, cette démo fonctionne mieux sur desktop. Pour une expérience optimale, utilisez Chrome ou Safari sur ordinateur.
                    </p>
                  </div>
                )}
                <Button
                  onClick={startCamera}
                  size="lg"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8"
                >
                  <Play className="mr-2 w-5 h-5" />
                  Activer la Caméra
                </Button>
              </motion>

              {error && (
                <motion
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 max-w-md"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion>
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
                <motion
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
                </motion>
              )}

              {/* Product Badge */}
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm border border-cyan-500/30 px-4 py-2 rounded-lg">
                <p className="text-sm text-white font-medium">
                  {selectedCategory === 'glasses' ? '🕶️ Lunettes' : selectedCategory === 'watch' ? '⌚ Montre' : '💍 Bijoux'}
                </p>
              </div>

              {/* Recording Indicator */}
              {isRecording && (
                <motion
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-500/20 backdrop-blur-sm border border-red-500 px-4 py-2 rounded-lg flex items-center gap-2"
                >
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-sm text-white font-medium">REC</span>
                </motion>
              )}

              {/* Close Button */}
              <button
                onClick={stopCamera}
                className="absolute top-4 right-4 mt-12 w-10 h-10 bg-black/60 backdrop-blur-sm border border-gray-500/30 rounded-lg flex items-center justify-center hover:bg-black/80 transition-colors"
                aria-label="Close camera"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>

        {/* Controls */}
        {isActive && showControls && (
          <motion
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
                aria-label="Take screenshot"
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
          </motion>
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
    </ARErrorBoundary>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
export default memo(TryOnDemo);

