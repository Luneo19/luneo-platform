/**
 * @luneo/ar-export - AR Quick Look professionnel
 * Lancement AR Quick Look iOS avec USDZ
 */

/**
 * Configuration AR Quick Look
 */
export interface ARQuickLookConfig {
  /** URL du fichier USDZ */
  usdzUrl: string;
  
  /** Nom du produit (affiché dans AR) */
  productName?: string;
  
  /** URL de la page après AR */
  callbackUrl?: string;
  
  /** Mode placement ('horizontal' | 'vertical') */
  placementMode?: 'horizontal' | 'vertical';
  
  /** Permettre scaling */
  allowScaling?: boolean;
  
  /** URL de l'image de fallback */
  fallbackImageUrl?: string;
}

/**
 * AR Quick Look Manager (iOS)
 * 
 * Features:
 * - Détection iOS/Safari
 * - Launch AR Quick Look
 * - Analytics tracking
 * - Fallback gracieux
 * 
 * @example
 * ```typescript
 * const arQuickLook = new ARQuickLook();
 * 
 * if (arQuickLook.isSupported()) {
 *   await arQuickLook.launch({
 *     usdzUrl: '/models/product.usdz',
 *     productName: 'Sunglasses Pro',
 *     allowScaling: true
 *   });
 * }
 * ```
 */
export class ARQuickLook {
  /**
   * Vérifie si AR Quick Look est supporté
   */
  isSupported(): boolean {
    // Check iOS
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    
    // Check Safari (AR Quick Look only works in Safari)
    const isSafari = /Safari/.test(navigator.userAgent) && 
                     !/Chrome/.test(navigator.userAgent);
    
    // Check iOS 12+ (AR Quick Look introduced in iOS 12)
    const iosVersion = this.getIOSVersion();
    const hasRequiredVersion = iosVersion >= 12;
    
    return isIOS && isSafari && hasRequiredVersion;
  }

  /**
   * Lance AR Quick Look
   */
  async launch(config: ARQuickLookConfig): Promise<void> {
    if (!this.isSupported()) {
      throw new Error('AR Quick Look not supported on this device');
    }
    
    console.log('🚀 Launching AR Quick Look...', config);
    
    // Créer le lien AR
    const link = document.createElement('a');
    link.rel = 'ar';
    link.href = config.usdzUrl;
    
    // Ajouter l'image de fallback (pour iOS < 13)
    if (config.fallbackImageUrl) {
      const img = document.createElement('img');
      img.src = config.fallbackImageUrl;
      img.alt = config.productName || 'Product';
      link.appendChild(img);
    }
    
    // Callback URL (custom scheme)
    const url = new URL(config.usdzUrl);
    const params = new URLSearchParams(url.hash.replace('#', ''));
    
    if (config.callbackUrl) {
      params.set('callbackURL', encodeURIComponent(config.callbackUrl));
    }
    
    if (config.placementMode) {
      params.set('placement', config.placementMode);
      params.set('allowsContentScaling', config.allowScaling ? '1' : '0');
    }
    
    url.hash = params.toString() ? `#${params.toString()}` : '';
    link.href = url.toString();
    
    // Append to body (required for click)
    document.body.appendChild(link);
    
    // Click to launch AR
    link.click();
    
    // Track analytics
    await this.trackLaunch(config);
    
    // Remove link after 100ms
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
    
    console.log('✅ AR Quick Look launched');
  }

  /**
   * Créer un bouton AR Quick Look
   */
  createButton(config: ARQuickLookConfig): HTMLAnchorElement {
    const button = document.createElement('a');
    button.rel = 'ar';
    button.href = config.usdzUrl;
    const img = document.createElement('img');
    if (config.fallbackImageUrl) {
      img.src = config.fallbackImageUrl;
    }
    img.alt = config.productName || 'View in AR';
    button.appendChild(img);
    button.style.display = 'inline-block';
    button.style.padding = '12px 24px';
    button.style.backgroundColor = '#007AFF';
    button.style.color = 'white';
    button.style.textDecoration = 'none';
    button.style.borderRadius = '8px';
    button.style.fontWeight = '600';
    
    // Click handler for analytics
    button.addEventListener('click', () => {
      this.trackLaunch(config);
    });
    
    return button;
  }

  /**
   * Obtient la version iOS
   */
  private getIOSVersion(): number {
    const match = navigator.userAgent.match(/OS (\d+)_/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Track analytics
   */
  private async trackLaunch(config: ARQuickLookConfig): Promise<void> {
    try {
      // Send analytics event
      await fetch('/api/analytics/ar-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'ar_quick_look',
          product_name: config.productName,
          usdz_url: config.usdzUrl,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('Failed to track AR launch:', error);
    }
  }
}

