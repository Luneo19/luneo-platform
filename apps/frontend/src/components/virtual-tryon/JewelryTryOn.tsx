'use client';

import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { HandTracker, HandLandmarks } from '@/lib/virtual-tryon/HandTracker';
import { FaceTracker, FaceLandmarks } from '@/lib/virtual-tryon/FaceTracker';
import { Button } from '@/components/ui/button';
import { Camera, Download, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface JewelryTryOnProps {
  productId: string;
  jewelryType: 'ring' | 'necklace' | 'earrings' | 'bracelet';
  jewelryModelUrl: string;
  onCapture?: (imageData: string) => void;
}

function JewelryTryOn({ productId, jewelryType, jewelryModelUrl, onCapture }: JewelryTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const handTrackerRef = useRef<HandTracker | null>(null);
  const faceTrackerRef = useRef<FaceTracker | null>(null);
  const jewelryImageRef = useRef<HTMLImageElement | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [handsDetected, setHandsDetected] = useState<number>(0);
  const [faceDetected, setFaceDetected] = useState(false);

  useEffect(() => {
    // Preload jewelry image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = jewelryModelUrl;
    img.onload = () => {
      jewelryImageRef.current = img;
    };

    return () => {
      if (handTrackerRef.current) {
        handTrackerRef.current.destroy();
      }
      if (faceTrackerRef.current) {
        faceTrackerRef.current.destroy();
      }
    };
  }, [jewelryModelUrl]);

  const startTryOn = async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    try {
      if (jewelryType === 'ring' || jewelryType === 'bracelet') {
        // Use hand tracking
        const tracker = new HandTracker();
        handTrackerRef.current = tracker;

        await tracker.initialize(videoRef.current);
        
        tracker.onResults((hands) => {
          setHandsDetected(hands.length);
          if (hands.length > 0) {
            drawJewelryOnHands(hands);
          }
        });

        tracker.start();
      } else {
        // Use face tracking for necklaces and earrings
        const tracker = new FaceTracker();
        faceTrackerRef.current = tracker;

        await tracker.initialize(videoRef.current);
        
        tracker.onResults((face) => {
          setFaceDetected(!!face);
          if (face) {
            drawJewelryOnFace(face);
          }
        });

        tracker.start();
      }

      setIsActive(true);
    } catch (error) {
      logger.error('Failed to start try-on', {
        error,
        productId,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      alert('Failed to access camera. Please grant camera permissions.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopTryOn = () => {
    if (handTrackerRef.current) {
      handTrackerRef.current.stop();
    }
    if (faceTrackerRef.current) {
      faceTrackerRef.current.stop();
    }
    setIsActive(false);
    setHandsDetected(0);
    setFaceDetected(false);
  };

  const drawJewelryOnHands = (hands: HandLandmarks[]) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !jewelryImageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    hands.forEach((hand) => {
      if (jewelryType === 'ring') {
        // Draw ring on ring finger (landmark 13-16)
        const ringBase = hand.ringFingerPosition;
        const x = ringBase.x * canvas.width;
        const y = ringBase.y * canvas.height;
        const size = hand.handSize * canvas.width * 0.15;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hand.handRotation.roll * (Math.PI / 180));
        ctx.globalAlpha = 0.9;
        if (jewelryImageRef.current) {
          ctx.drawImage(
            jewelryImageRef.current,
            -size / 2,
            -size / 2,
            size,
            size
          );
        }
        ctx.restore();
      } else if (jewelryType === 'bracelet') {
        // Draw bracelet on wrist
        const wrist = hand.wristPosition;
        const x = wrist.x * canvas.width;
        const y = wrist.y * canvas.height;
        const width = hand.handSize * canvas.width * 1.2;
        const height = width * 0.4;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(hand.handRotation.roll * (Math.PI / 180));
        ctx.globalAlpha = 0.9;
        if (jewelryImageRef.current) {
          ctx.drawImage(
            jewelryImageRef.current,
            -width / 2,
            -height / 2,
            width,
            height
          );
        }
        ctx.restore();
      }
    });
  };

  const drawJewelryOnFace = (face: FaceLandmarks) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !jewelryImageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (jewelryType === 'necklace') {
      // Draw necklace below chin
      const nose = face.nosePosition;
      const faceBottom = (face.boundingBox.yMax + 0.1) * canvas.height;
      const x = nose.x * canvas.width;
      const y = faceBottom;
      const width = face.faceWidth * canvas.width * 1.2;
      const height = width * 0.6;

      ctx.save();
      ctx.translate(x, y);
      ctx.globalAlpha = 0.9;
      ctx.drawImage(
        jewelryImageRef.current,
        -width / 2,
        0,
        width,
        height
      );
      ctx.restore();
    } else if (jewelryType === 'earrings') {
      // Draw earrings on ears
      // Simplified - use face width to estimate ear positions
      const faceCenter = {
        x: (face.boundingBox.xMin + face.boundingBox.xMax) / 2,
        y: face.eyePositions.left.y,
      };
      
      const earOffset = face.faceWidth * 0.55;
      const earringSize = face.faceWidth * canvas.width * 0.15;

      // Left earring
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(
        jewelryImageRef.current,
        (faceCenter.x - earOffset) * canvas.width - earringSize / 2,
        faceCenter.y * canvas.height - earringSize / 2,
        earringSize,
        earringSize
      );
      ctx.restore();

      // Right earring
      ctx.save();
      ctx.globalAlpha = 0.9;
      ctx.drawImage(
        jewelryImageRef.current,
        (faceCenter.x + earOffset) * canvas.width - earringSize / 2,
        faceCenter.y * canvas.height - earringSize / 2,
        earringSize,
        earringSize
      );
      ctx.restore();
    }
  };

  const captureSnapshot = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    
    if (!canvas || !video || !overlay) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame (mirrored)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw jewelry overlay (mirrored)
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(overlay, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const imageData = canvas.toDataURL('image/png');
    onCapture?.(imageData);
  };

  const isDetected = jewelryType === 'ring' || jewelryType === 'bracelet' 
    ? handsDetected > 0 
    : faceDetected;

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Video & Overlay */}
      <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover mirror"
          playsInline
          muted
        />
        <canvas
          ref={overlayCanvasRef}
          className="absolute inset-0 w-full h-full mirror"
        />
        <canvas
          ref={canvasRef}
          className="hidden"
        />
        
        {/* Instructions */}
        {isActive && !isDetected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white text-xl font-semibold">
              {jewelryType === 'ring' || jewelryType === 'bracelet' 
                ? '✋ Show your hand to the camera'
                : '👤 Face the camera'}
            </p>
          </div>
        )}
        
        {/* Status indicator */}
        {isDetected && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            {jewelryType === 'ring' || jewelryType === 'bracelet' 
              ? `${handsDetected} Hand${handsDetected > 1 ? 's' : ''} Detected`
              : 'Face Detected'}
          </div>
        )}
      </div>

      <p className="mt-2 text-center text-xs text-gray-500">
        Produit associé&nbsp;: <span className="font-mono text-gray-300">{productId}</span>
      </p>

      {/* Controls */}
      <div className="flex gap-4 mt-4 justify-center">
        {!isActive ? (
          <Button
            onClick={startTryOn}
            disabled={isLoading}
            size="lg"
          >
            <Camera className="mr-2 h-5 w-5" />
            {isLoading ? 'Starting...' : 'Start Try-On'}
          </Button>
        ) : (
          <>
            <Button
              onClick={captureSnapshot}
              variant="default"
              size="lg"
              disabled={!isDetected}
            >
              <Download className="mr-2 h-5 w-5" />
              Capture Photo
            </Button>
            <Button
              onClick={stopTryOn}
              variant="outline"
              size="lg"
            >
              <RotateCcw className="mr-2 h-5 w-5" />
              Stop
            </Button>
          </>
        )}
      </div>

      <style jsx>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}

// Optimisation avec React.memo pour éviter les re-renders inutiles
const JewelryTryOnMemo = memo(JewelryTryOn);

export default function JewelryTryOnWithErrorBoundary(props: JewelryTryOnProps) {
  return (
    <ErrorBoundary componentName="JewelryTryOn">
      <JewelryTryOnMemo {...props} />
    </ErrorBoundary>
  );
}

