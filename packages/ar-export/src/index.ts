/**
 * @luneo/ar-export
 * AR Export professionnel - USDZ, AR Quick Look, Scene Viewer, WebXR
 */

export { USDZConverter } from './USDZConverter';
export type { 
  USDZConversionOptions, 
  USDZConversionResult 
} from './USDZConverter';

export { ARQuickLook } from './ARQuickLook';
export type { ARQuickLookConfig } from './ARQuickLook';

export { SceneViewer } from './SceneViewer';
export type { SceneViewerConfig } from './SceneViewer';

export { WebXRViewer } from './WebXRViewer';
export type { WebXRConfig } from './WebXRViewer';

/**
 * Helper: Détecter la plateforme et lancer l'AR approprié
 */
export async function launchAR(config: {
  glbUrl: string;
  usdzUrl?: string;
  productName: string;
  fallbackUrl?: string;
}): Promise<void> {
  // iOS: AR Quick Look
  if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    if (!config.usdzUrl) {
      throw new Error('USDZ URL required for iOS AR');
    }
    
    const arQuickLook = new ARQuickLook();
    if (arQuickLook.isSupported()) {
      await arQuickLook.launch({
        usdzUrl: config.usdzUrl,
        productName: config.productName,
        fallbackImageUrl: config.fallbackUrl,
      });
      return;
    }
  }
  
  // Android: Scene Viewer
  if (/Android/.test(navigator.userAgent)) {
    const sceneViewer = new SceneViewer();
    if (sceneViewer.isSupported()) {
      sceneViewer.launch({
        glbUrl: config.glbUrl,
        productName: config.productName,
        fallbackUrl: config.fallbackUrl,
      });
      return;
    }
  }
  
  // Fallback: ouvrir URL
  if (config.fallbackUrl) {
    window.location.href = config.fallbackUrl;
  } else {
    throw new Error('AR not supported on this device');
  }
}

/**
 * Helper: Vérifier le support AR
 */
export function checkARSupport(): {
  platform: 'ios' | 'android' | 'desktop' | 'unknown';
  arSupported: boolean;
  arType: 'ar-quick-look' | 'scene-viewer' | 'webxr' | 'none';
} {
  const ua = navigator.userAgent;
  
  // iOS
  if (/iPhone|iPad|iPod/.test(ua)) {
    const arQuickLook = new ARQuickLook();
    return {
      platform: 'ios',
      arSupported: arQuickLook.isSupported(),
      arType: arQuickLook.isSupported() ? 'ar-quick-look' : 'none',
    };
  }
  
  // Android
  if (/Android/.test(ua)) {
    const sceneViewer = new SceneViewer();
    return {
      platform: 'android',
      arSupported: sceneViewer.isSupported(),
      arType: sceneViewer.isSupported() ? 'scene-viewer' : 'none',
    };
  }
  
  // Desktop
  return {
    platform: 'desktop',
    arSupported: false,
    arType: 'none',
  };
}

