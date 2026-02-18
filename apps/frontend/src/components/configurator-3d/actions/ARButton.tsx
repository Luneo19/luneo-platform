'use client';

import React from 'react';
import { Box, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConfigurator3DAR } from '@/hooks/configurator-3d/useConfigurator3DAR';
import { useConfigurator3DStore } from '@/stores/configurator-3d/configurator.store';
import { cn } from '@/lib/utils';

export interface ARButtonProps {
  className?: string;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showLabel?: boolean;
}

function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

export function ARButton({
  className,
  variant = 'outline',
  size = 'default',
  showLabel = true,
}: ARButtonProps) {
  const { isARSupported, launchAR, arStatus } = useConfigurator3DAR();
  const enableAR =
    useConfigurator3DStore((s) => s.configuration?.features?.enableAR) ?? false;

  const visible = enableAR && isARSupported;
  const icon = isIOS() ? <Box className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />;

  if (!visible) return null;

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => launchAR(isIOS() ? 'usdz' : 'glb')}
      disabled={arStatus === 'exporting'}
    >
      {arStatus === 'exporting' ? (
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          {showLabel && 'Preparing...'}
        </span>
      ) : (
        <>
          {icon}
          {showLabel && (
            <span className={cn(icon && 'ml-2')}>
              View in AR
            </span>
          )}
        </>
      )}
    </Button>
  );
}
