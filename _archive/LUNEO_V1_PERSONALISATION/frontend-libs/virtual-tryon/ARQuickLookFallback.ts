import { DeviceCompatibility } from './DeviceCompatibility';
import { logger } from '@/lib/logger';

export interface ARFallbackConfig {
  modelUSDZUrl?: string; // iOS AR Quick Look
  modelGLBUrl?: string; // Android Scene Viewer
  productName?: string;
  callToAction?: string; // e.g., "Buy Now" button in AR
  callToActionUrl?: string;
}

export interface ARFallbackResult {
  supported: boolean;
  platform: 'ios' | 'android' | 'none';
  launched: boolean;
}

/**
 * ARQuickLookFallback - Native AR experiences for iOS and Android.
 *
 * iOS: Uses AR Quick Look via <a rel="ar"> with USDZ model
 * Android: Uses Scene Viewer via intent URL with GLB model
 *
 * These provide a native AR experience without WebGL overhead,
 * ideal for devices where WebGL-based try-on is too slow.
 */
export class ARQuickLookFallback {
  /**
   * Check if native AR is available on this device.
   */
  static isAvailable(): { ios: boolean; android: boolean } {
    return {
      ios: DeviceCompatibility.isIOS(),
      android: DeviceCompatibility.isAndroid(),
    };
  }

  /**
   * Launch the appropriate native AR viewer.
   * Returns whether the launch was successful.
   */
  static launch(config: ARFallbackConfig): ARFallbackResult {
    const isIOS = DeviceCompatibility.isIOS();
    const isAndroid = DeviceCompatibility.isAndroid();

    if (isIOS && config.modelUSDZUrl) {
      return ARQuickLookFallback.launchIOSQuickLook(config);
    }

    if (isAndroid && config.modelGLBUrl) {
      return ARQuickLookFallback.launchAndroidSceneViewer(config);
    }

    logger.warn('No native AR available for this device');
    return { supported: false, platform: 'none', launched: false };
  }

  /**
   * Create an AR link element that can be clicked to open AR.
   * Useful for embedding in product pages.
   */
  static createARLink(
    config: ARFallbackConfig,
  ): HTMLAnchorElement | null {
    const isIOS = DeviceCompatibility.isIOS();

    if (isIOS && config.modelUSDZUrl) {
      return ARQuickLookFallback.createIOSLink(config);
    }

    if (config.modelGLBUrl) {
      return ARQuickLookFallback.createAndroidLink(config);
    }

    return null;
  }

  // ========================================
  // iOS AR Quick Look
  // ========================================

  private static launchIOSQuickLook(config: ARFallbackConfig): ARFallbackResult {
    try {
      const link = ARQuickLookFallback.createIOSLink(config);
      if (!link) {
        return { supported: true, platform: 'ios', launched: false };
      }

      // Temporarily add to DOM and click
      document.body.appendChild(link);
      link.click();

      // Clean up after a short delay
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);

      logger.info('iOS AR Quick Look launched', {
        model: config.modelUSDZUrl,
      });

      return { supported: true, platform: 'ios', launched: true };
    } catch (error) {
      logger.error('Failed to launch iOS AR Quick Look', { error });
      return { supported: true, platform: 'ios', launched: false };
    }
  }

  private static createIOSLink(config: ARFallbackConfig): HTMLAnchorElement | null {
    if (!config.modelUSDZUrl) return null;

    const link = document.createElement('a');
    link.rel = 'ar';
    link.href = config.modelUSDZUrl;
    link.style.display = 'none';

    // Add a thumbnail image (required for AR Quick Look)
    const img = document.createElement('img');
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    link.appendChild(img);

    // Add call-to-action banner if provided
    if (config.callToAction && config.callToActionUrl) {
      // AR Quick Look supports custom actions via hash params
      const params = new URLSearchParams();
      params.set('callToAction', config.callToAction);
      params.set('callToActionURL', config.callToActionUrl);
      link.href = `${config.modelUSDZUrl}#${params.toString()}`;
    }

    return link;
  }

  // ========================================
  // Android Scene Viewer
  // ========================================

  private static launchAndroidSceneViewer(
    config: ARFallbackConfig,
  ): ARFallbackResult {
    try {
      const link = ARQuickLookFallback.createAndroidLink(config);
      if (!link) {
        return { supported: true, platform: 'android', launched: false };
      }

      // Open the intent URL
      window.location.href = link.href;

      logger.info('Android Scene Viewer launched', {
        model: config.modelGLBUrl,
      });

      return { supported: true, platform: 'android', launched: true };
    } catch (error) {
      logger.error('Failed to launch Android Scene Viewer', { error });
      return { supported: true, platform: 'android', launched: false };
    }
  }

  private static createAndroidLink(
    config: ARFallbackConfig,
  ): HTMLAnchorElement | null {
    if (!config.modelGLBUrl) return null;

    const link = document.createElement('a');

    // Build Scene Viewer intent URL
    const params = new URLSearchParams({
      file: config.modelGLBUrl,
      mode: 'ar_preferred',
      title: config.productName || 'Product',
    });

    if (config.callToAction && config.callToActionUrl) {
      params.set('link', config.callToActionUrl);
      params.set('linkTitle', config.callToAction);
    }

    link.href = `intent://arvr.google.com/scene-viewer/1.0?${params.toString()}#Intent;scheme=https;package=com.google.android.googlequicksearchbox;action=android.intent.action.VIEW;S.browser_fallback_url=${encodeURIComponent(config.modelGLBUrl)};end;`;

    return link;
  }

  /**
   * Track when the user returns from the AR experience.
   * Uses visibilitychange event since AR viewers take focus.
   */
  static onReturnFromAR(callback: () => void): () => void {
    let arLaunched = false;

    const handler = () => {
      if (document.visibilityState === 'hidden') {
        arLaunched = true;
      } else if (document.visibilityState === 'visible' && arLaunched) {
        arLaunched = false;
        callback();
      }
    };

    document.addEventListener('visibilitychange', handler);

    // Return cleanup function that removes the exact same listener reference
    return () => {
      document.removeEventListener('visibilitychange', handler);
    };
  }
}
