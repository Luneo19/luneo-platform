/**
 * Hook for AR platform detection
 */

'use client';

import { useState, useEffect, useMemo } from 'react';

export type ARPlatform = 'ios' | 'android' | 'desktop' | 'unknown';

export interface PlatformInfo {
  platform: ARPlatform;
  isIOS: boolean;
  isAndroid: boolean;
  isDesktop: boolean;
  supportsAR: boolean;
  supportsWebXR: boolean;
  userAgent: string;
}

function detectPlatform(): PlatformInfo {
  if (typeof navigator === 'undefined') {
    return {
      platform: 'unknown',
      isIOS: false,
      isAndroid: false,
      isDesktop: true,
      supportsAR: false,
      supportsWebXR: false,
      userAgent: '',
    };
  }

  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isAndroid = /Android/.test(ua);
  const isDesktop = !isIOS && !isAndroid;

  let platform: ARPlatform = 'unknown';
  if (isIOS) platform = 'ios';
  else if (isAndroid) platform = 'android';
  else if (isDesktop) platform = 'desktop';

  const supportsWebXR = typeof navigator !== 'undefined' && 'xr' in navigator;
  const supportsAR = supportsWebXR || (isIOS && 'ApplePaySession' in window);

  return {
    platform,
    isIOS,
    isAndroid,
    isDesktop,
    supportsAR,
    supportsWebXR,
    userAgent: ua,
  };
}

export function usePlatformDetection(): PlatformInfo {
  const [info, setInfo] = useState<PlatformInfo>(() => detectPlatform());

  useEffect(() => {
    setInfo(detectPlatform());
  }, []);

  return info;
}

export function useSupportsAR(): boolean {
  const { supportsAR } = usePlatformDetection();
  return supportsAR;
}
