/**
 * @luneo/ar-export - Scene Viewer professionnel
 * Lancement Scene Viewer Android avec GLB
 */

/**
 * Configuration Scene Viewer
 */
export interface SceneViewerConfig {
  /** URL du fichier GLB */
  glbUrl: string;
  
  /** Nom du produit */
  productName?: string;
  
  /** URL de fallback si AR pas supporté */
  fallbackUrl?: string;
  
  /** Mode AR ('ar_only' | 'ar_preferred') */
  mode?: 'ar_only' | 'ar_preferred';
  
  /** Permettre scaling */
  enableScaling?: boolean;
  
  /** Son d'ambiance */
  soundUrl?: string;
}

/**
 * Scene Viewer Manager (Android)
 * 
 * Features:
 * - Détection Android/Chrome
 * - Launch Scene Viewer
 * - Deep link handling
 * - Fallback gracieux
 * 
 * @example
 * ```typescript
 * const sceneViewer = new SceneViewer();
 * 
 * if (sceneViewer.isSupported()) {
 *   sceneViewer.launch({
 *     glbUrl: '/models/product.glb',
 *     productName: 'Watch Classic',
 *     mode: 'ar_only'
 *   });
 * }
 * ```
 */
export class SceneViewer {
  /**
   * Vérifie si Scene Viewer est supporté
   */
  isSupported(): boolean {
    // Check Android
    const isAndroid = /Android/.test(navigator.userAgent);
    
    // Check Chrome (Scene Viewer works best in Chrome)
    const isChrome = /Chrome/.test(navigator.userAgent);
    
    // Check Android 7+ (Scene Viewer introduced in Android 7)
    const androidVersion = this.getAndroidVersion();
    const hasRequiredVersion = androidVersion >= 7;
    
    return isAndroid && isChrome && hasRequiredVersion;
  }

  /**
   * Lance Scene Viewer
   */
  launch(config: SceneViewerConfig): void {
    if (!this.isSupported()) {
      console.warn('Scene Viewer not supported, using fallback');
      this.handleFallback(config);
      return;
    }
    
    console.log('🚀 Launching Scene Viewer...', config);
    
    // Construire l'Intent URL pour Scene Viewer
    const intentUrl = this.buildIntentUrl(config);
    
    console.log('Intent URL:', intentUrl);
    
    // Track analytics
    this.trackLaunch(config);
    
    // Lancer Scene Viewer
    window.location.href = intentUrl;
    
    console.log('✅ Scene Viewer launched');
  }

  /**
   * Créer un bouton Scene Viewer
   */
  createButton(config: SceneViewerConfig): HTMLButtonElement {
    const button = document.createElement('button');
    button.textContent = 'View in AR';
    button.style.padding = '12px 24px';
    button.style.backgroundColor = '#34A853';
    button.style.color = 'white';
    button.style.border = 'none';
    button.style.borderRadius = '8px';
    button.style.fontWeight = '600';
    button.style.cursor = 'pointer';
    
    button.addEventListener('click', () => {
      this.launch(config);
    });
    
    return button;
  }

  /**
   * Construit l'Intent URL
   */
  private buildIntentUrl(config: SceneViewerConfig): string {
    const params = new URLSearchParams({
      file: config.glbUrl,
      mode: config.mode || 'ar_preferred',
      resizable: config.enableScaling ? 'true' : 'false',
      title: config.productName || 'Product',
    });
    
    if (config.soundUrl) {
      params.append('sound', config.soundUrl);
    }
    
    const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?${params.toString()}`;
    
    // Intent URL pour Android
    const intentUrl = [
      'intent://arvr.google.com/scene-viewer/1.0',
      `?${params.toString()}`,
      '#Intent',
      'scheme=https',
      'package=com.google.android.googlequicksearchbox',
      'action=android.intent.action.VIEW',
      `S.browser_fallback_url=${encodeURIComponent(config.fallbackUrl || window.location.href)}`,
      'end'
    ].join(';');
    
    return intentUrl;
  }

  /**
   * Obtient la version Android
   */
  private getAndroidVersion(): number {
    const match = navigator.userAgent.match(/Android (\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Gère le fallback si AR pas supporté
   */
  private handleFallback(config: SceneViewerConfig): void {
    if (config.fallbackUrl) {
      window.location.href = config.fallbackUrl;
    } else {
      alert('AR not supported on this device. Please use an Android device with Chrome.');
    }
  }

  /**
   * Track analytics
   */
  private async trackLaunch(config: SceneViewerConfig): Promise<void> {
    try {
      await fetch('/api/analytics/ar-launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'scene_viewer',
          product_name: config.productName,
          glb_url: config.glbUrl,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      console.warn('Failed to track AR launch:', error);
    }
  }
}

