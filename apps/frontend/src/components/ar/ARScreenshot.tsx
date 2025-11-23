'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Download, Share2, X } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LazyImage } from '@/components/optimized/LazyImage';
import { logger } from '@/lib/logger';

interface ARScreenshotProps {
  productName: string;
  onShare?: (imageData: string) => void;
}

export function ARScreenshot({ productName, onShare }: ARScreenshotProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1920, height: 1080 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);
      }
    } catch (error) {
      logger.error('Failed to start camera', {
        error,
        productName,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      alert('Could not access camera');
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setIsCameraActive(false);
    }
  };

  const captureScreenshot = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Add watermark
    ctx.font = '20px Arial';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText(`${productName} - Powered by Luneo`, 20, canvas.height - 20);

    // Get image data
    const imageData = canvas.toDataURL('image/png');
    setScreenshot(imageData);
    stopCamera();
  };

  const downloadScreenshot = () => {
    if (!screenshot) return;

    const link = document.createElement('a');
    link.download = `${productName.replace(/\s+/g, '-')}-ar-${Date.now()}.png`;
    link.href = screenshot;
    link.click();
  };

  const shareScreenshot = async () => {
    if (!screenshot) return;

    try {
      const blob = await (await fetch(screenshot)).blob();
      const file = new File([blob], `${productName}-ar.png`, { type: 'image/png' });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: `${productName} in AR`,
          text: `Check out this product in my space!`,
        });
      } else {
        downloadScreenshot();
      }
    } catch (error) {
      logger.error('Share failed', {
        error,
        productName,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      downloadScreenshot();
    }

    onShare?.(screenshot);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AR Screenshot</CardTitle>
      </CardHeader>
      <CardContent>
        {!screenshot ? (
          <div className="space-y-4">
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              
              {!isCameraActive && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white">Camera preview will appear here</p>
                </div>
              )}
            </div>

            {!isCameraActive ? (
              <Button onClick={startCamera} className="w-full">
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={captureScreenshot} className="flex-1">
                  <Camera className="mr-2 h-4 w-4" />
                  Capture
                </Button>
                <Button onClick={stopCamera} variant="outline">
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <LazyImage
              src={screenshot}
              alt="AR Screenshot"
              className="h-full w-full rounded-lg"
              sizes="100vw"
              fallback="/images/fallback.svg"
            />
          </div>
        )}
      </CardContent>

      {screenshot && (
        <CardFooter className="flex gap-2">
          <Button onClick={downloadScreenshot} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button onClick={shareScreenshot} variant="outline" className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
          <Button onClick={() => setScreenshot(null)} variant="ghost">
            <X className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

