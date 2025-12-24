'use client';

import { useEffect, useRef, useState, memo, useCallback } from 'react';
import { FaceTracker, FaceLandmarks } from '@/lib/virtual-tryon/FaceTracker';
import { Button } from '@/components/ui/button';
import { Camera, Download, RotateCcw } from 'lucide-react';
import { logger } from '@/lib/logger';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface EyewearTryOnProps {
  productId: string;
  eyewearModelUrl: string;
  onCapture?: (imageData: string) => void;
}

function EyewearTryOn({ productId, eyewearModelUrl, onCapture }: EyewearTryOnProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const faceTrackerRef = useRef<FaceTracker | null>(null);
  const eyewearImageRef = useRef<HTMLImageElement | null>(null);
  
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [faceLandmarks, setFaceLandmarks] = useState<FaceLandmarks | null>(null);

  useEffect(() => {
    // Preload eyewear image
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = eyewearModelUrl;
    img.onload = () => {
      eyewearImageRef.current = img;
    };

    return () => {
      if (faceTrackerRef.current) {
        faceTrackerRef.current.destroy();
      }
    };
  }, [eyewearModelUrl]);

  const startTryOn = async () => {
    if (!videoRef.current) return;

    setIsLoading(true);
    try {
      const tracker = new FaceTracker();
      faceTrackerRef.current = tracker;

      await tracker.initialize(videoRef.current);
      
      tracker.onResults((landmarks) => {
        setFaceLandmarks(landmarks);
        if (landmarks) {
          drawEyewear(landmarks);
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
    if (faceTrackerRef.current) {
      faceTrackerRef.current.stop();
      setIsActive(false);
      setFaceLandmarks(null);
    }
  };

  const drawEyewear = (landmarks: FaceLandmarks) => {
    const canvas = overlayCanvasRef.current;
    const video = videoRef.current;
    
    if (!canvas || !video || !eyewearImageRef.current) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Match canvas size to video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Get eye positions
    const leftEye = landmarks.eyePositions.left;
    const rightEye = landmarks.eyePositions.right;
    const eyeDistance = landmarks.eyePositions.distance;

    // Calculate eyewear position and size
    const centerX = (leftEye.x + rightEye.x) / 2 * canvas.width;
    const centerY = (leftEye.y + rightEye.y) / 2 * canvas.height;
    const scale = eyeDistance * canvas.width * 2.5; // Adjust multiplier for glasses size

    // Calculate rotation based on eye angle
    const angle = Math.atan2(
      rightEye.y - leftEye.y,
      rightEye.x - leftEye.x
    );

    // Draw eyewear
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(angle);
    ctx.scale(1 + landmarks.rotation.yaw / 100, 1); // Adjust for head turn
    ctx.globalAlpha = 0.9;
    
    const eyewearWidth = scale;
    const eyewearHeight = scale * 0.4;
    
    ctx.drawImage(
      eyewearImageRef.current,
      -eyewearWidth / 2,
      -eyewearHeight / 2,
      eyewearWidth,
      eyewearHeight
    );
    
    ctx.restore();
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
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Draw eyewear overlay
    ctx.drawImage(overlay, 0, 0);

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
        
        {/* Status indicator */}
        {faceLandmarks && (
          <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-sm">
            Face Detected
          </div>
        )}
      </div>

      {productId && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Produit associé&nbsp;: <span className="font-mono text-gray-300">{productId}</span>
        </p>
      )}

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
const EyewearTryOnMemo = memo(EyewearTryOn);

export default function EyewearTryOnWithErrorBoundary(props: EyewearTryOnProps) {
  return (
    <ErrorBoundary componentName="EyewearTryOn">
      <EyewearTryOnMemo {...props} />
    </ErrorBoundary>
  );
}
export default memo(EyewearTryOn);