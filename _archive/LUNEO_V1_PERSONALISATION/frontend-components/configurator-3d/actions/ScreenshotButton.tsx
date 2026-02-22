'use client';

import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { ScreenshotModal } from '../modals/ScreenshotModal';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export interface ScreenshotButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
  /** Callback when canvas ref is available for capture */
  onCaptureRequest?: (capture: () => Promise<string | null>) => void;
}

export function ScreenshotButton({
  className,
  variant = 'outline',
  size = 'default',
  showLabel = true,
  onCaptureRequest,
}: ScreenshotButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const captureScreenshot = useConfigurator3DStore((s) => s.captureScreenshot);
  const enableScreenshots =
    useConfigurator3DStore((s) => s.configuration?.features?.enableScreenshots) ?? true;

  const handleClick = async () => {
    if (!enableScreenshots) {
      toast({
        title: 'Screenshots disabled',
        description: 'This configurator does not support screenshots.',
        variant: 'destructive',
      });
      return;
    }

    if (onCaptureRequest) {
      onCaptureRequest(captureScreenshot);
      setIsOpen(true);
      return;
    }

    const url = await captureScreenshot();
    if (url) {
      setImageUrl(url);
      setIsOpen(true);
    } else {
      toast({
        title: 'Screenshot failed',
        description: 'Could not capture the 3D view. Ensure the canvas is visible.',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleClick}
        disabled={!enableScreenshots}
      >
        <Camera className={cn('h-4 w-4', showLabel && 'mr-2')} />
        {showLabel && 'Screenshot'}
      </Button>
      <ScreenshotModal
        open={isOpen}
        onOpenChange={setIsOpen}
        imageUrl={imageUrl}
        onCapture={captureScreenshot}
      />
    </>
  );
}
