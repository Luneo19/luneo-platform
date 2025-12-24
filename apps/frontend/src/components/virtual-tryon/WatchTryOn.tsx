'use client';

import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { HandTracker, HandLandmarks } from '@/lib/virtual-tryon/HandTracker';
import { Button } from '@/components/ui/button';
import { Camera, Download, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface WatchTryOnProps {
  productId: string;
  watchModelUrl: string;
  onCapture?: (imageData: string) => void;
}

function WatchTryOn({ productId, watchModelUrl, onCapture }: WatchTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const handTrackerRef = useRef<HandTracker | null>(null);
  const watchImageRef = useRef<HTMLImageElement | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [handsDetected, setHandsDetected] = useState<number>(0);

  useEffect(() => {
    // Preload watch image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = watchModelUrl;
    img.onload = () => {
      watchImageRef.current = img;
    };

    return () => {
      if (handTrackerRef.current) {
        handTrackerRef.current.destroy();
      }
    };
  }, [watchModelUrl]);

  const startTryOn = async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    try {
      const tracker = new HandTracker();
      handTrackerRef.current = tracker;

      await tracker.initialize(videoRef.current);
      
      tracker.onResults((hands) => {
        setHandsDetected(hands.length);
        if (hands.length > 0) {
          drawWatch(hands);
        }
      });

      tracker.start();
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
      setIsActive(false);
      setHandsDetected(0);
    }
  };

  const drawWatch = (hands: HandLandmarks[]) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !watchImageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw watch on each detected hand
    hands.forEach((hand) => {
      const wrist = hand.wristPosition;
      const handSize = hand.handSize;

      // Calculate watch position (centered on wrist)
      const x = wrist.x * canvas.width;
      const y = wrist.y * canvas.height;

      // Calculate watch size based on hand size
      const watchWidth = handSize * canvas.width * 0.8;
      const watchHeight = watchWidth * 0.7;

      // Calculate rotation
      const angle = hand.handRotation.roll * (Math.PI / 180);

      // Draw watch
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle);
      
      // Adjust for perspective based on hand rotation
      const scaleX = 1 - Math.abs(hand.handRotation.yaw) / 200;
      ctx.scale(scaleX, 1);
      
      ctx.globalAlpha = 0.95;
      if (watchImageRef.current) {
        ctx.drawImage(
          watchImageRef.current,
          -watchWidth / 2,
          -watchHeight / 2,
          watchWidth,
          watchHeight
        );
      }
      
      ctx.restore();
    });
  };

  const captureSnapshot = () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const overlay = overlayCanvasRef.current;
    
    if (!canvas || !video || !overlay) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw video frame
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Draw watch overlay
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(overlay, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    // Get image data
    const imageData = canvas.toDataURL('image/png');
    onCapture?.(imageData);
  };

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
        {isActive && handsDetected === 0 && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <p className="text-white text-xl font-semibold">
              ✋ Show your hand to the camera
            </p>
          </div>
        )}
        
        {/* Status indicator */}
        {handsDetected > 0 && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            {handsDetected} Hand{handsDetected > 1 ? 's' : ''} Detected
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
              disabled={handsDetected === 0}
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
const WatchTryOnMemo = memo(WatchTryOn);

export default function WatchTryOnWithErrorBoundary(props: WatchTryOnProps) {
  return (
    <ErrorBoundary componentName="WatchTryOn">
      <WatchTryOnMemo {...props} />
    </ErrorBoundary>
  );
}

