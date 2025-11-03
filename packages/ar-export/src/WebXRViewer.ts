/**
 * @luneo/ar-export - WebXR Viewer professionnel
 * AR dans le navigateur avec WebXR API
 */

import * as THREE from 'three';

/**
 * Configuration WebXR
 */
export interface WebXRConfig {
  /** Scene Three.js */
  scene: THREE.Scene;
  
  /** Camera Three.js */
  camera: THREE.Camera;
  
  /** Renderer Three.js */
  renderer: THREE.WebGLRenderer;
  
  /** Modèle 3D à afficher en AR */
  model: THREE.Object3D;
  
  /** Permettre hit test (placement sur surfaces) */
  enableHitTest?: boolean;
  
  /** DOM overlay pour UI */
  domOverlay?: HTMLElement;
}

/**
 * WebXR Viewer professionnel
 * 
 * Features:
 * - WebXR API implementation
 * - Hit test (surface detection)
 * - Placement interactif
 * - DOM overlay pour UI
 * - Session management
 * 
 * @example
 * ```typescript
 * const webXR = new WebXRViewer({
 *   scene: scene,
 *   camera: camera,
 *   renderer: renderer,
 *   model: productModel,
 *   enableHitTest: true
 * });
 * 
 * if (await webXR.isSupported()) {
 *   await webXR.startSession();
 * }
 * ```
 */
export class WebXRViewer {
  private config: WebXRConfig;
  private session: XRSession | null = null;
  private referenceSpace: XRReferenceSpace | null = null;
  private hitTestSource: XRHitTestSource | null = null;
  private reticle: THREE.Mesh | null = null;
  private modelPlaced: boolean = false;

  constructor(config: WebXRConfig) {
    this.config = {
      enableHitTest: true,
      ...config,
    };
    
    // Setup renderer for XR
    this.config.renderer.xr.enabled = true;
    
    // Create reticle (placement indicator)
    if (this.config.enableHitTest) {
      this.createReticle();
    }
  }

  /**
   * Vérifie si WebXR est supporté
   */
  async isSupported(): Promise<boolean> {
    if (!('xr' in navigator)) {
      console.warn('WebXR not supported');
      return false;
    }
    
    try {
      const supported = await (navigator as any).xr.isSessionSupported('immersive-ar');
      return supported;
    } catch {
      return false;
    }
  }

  /**
   * Démarre une session WebXR
   */
  async startSession(): Promise<void> {
    if (!(await this.isSupported())) {
      throw new Error('WebXR AR not supported');
    }
    
    console.log('🚀 Starting WebXR session...');
    
    try {
      // Session options
      const sessionInit: XRSessionInit = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay'],
      };
      
      // DOM overlay
      if (this.config.domOverlay) {
        (sessionInit as any).domOverlay = {
          root: this.config.domOverlay,
        };
      }
      
      // Request session
      this.session = await (navigator as any).xr.requestSession('immersive-ar', sessionInit);
      
      console.log('✅ WebXR session created');
      
      // Setup XR session
      await this.setupXRSession();
      
      // Start render loop
      this.config.renderer.xr.setSession(this.session);
      
      console.log('✅ WebXR session started');
      
    } catch (error) {
      console.error('Failed to start WebXR session:', error);
      throw error;
    }
  }

  /**
   * Arrête la session
   */
  async stopSession(): Promise<void> {
    if (this.session) {
      await this.session.end();
      this.session = null;
      this.referenceSpace = null;
      this.hitTestSource = null;
      this.modelPlaced = false;
      
      console.log('WebXR session stopped');
    }
  }

  /**
   * Setup de la session XR
   */
  private async setupXRSession(): Promise<void> {
    if (!this.session) return;
    
    // Get reference space
    this.referenceSpace = await this.session.requestReferenceSpace('local');
    
    // Setup hit test
    if (this.config.enableHitTest) {
      const viewerSpace = await this.session.requestReferenceSpace('viewer');
      this.hitTestSource = await this.session.requestHitTestSource({
        space: viewerSpace,
      }) || null;
    }
    
    // Session end handler
    this.session.addEventListener('end', () => {
      this.session = null;
      this.referenceSpace = null;
      this.hitTestSource = null;
      console.log('WebXR session ended');
    });
    
    // Select handler (tap to place)
    this.session.addEventListener('select', (event) => {
      this.onSelect(event);
    });
  }

  /**
   * Créer le reticle (indicateur de placement)
   */
  private createReticle(): void {
    const geometry = new THREE.RingGeometry(0.15, 0.2, 32);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      opacity: 0.5,
      transparent: true,
      side: THREE.DoubleSide,
    });
    
    this.reticle = new THREE.Mesh(geometry, material);
    this.reticle.rotation.x = -Math.PI / 2; // Horizontal
    this.reticle.visible = false;
    this.config.scene.add(this.reticle);
  }

  /**
   * Handler de sélection (placement)
   */
  private onSelect(event: XRInputSourceEvent): void {
    if (!this.reticle || !this.reticle.visible) {
      return;
    }
    
    // Placer le modèle à la position du reticle
    if (!this.modelPlaced) {
      this.config.model.position.copy(this.reticle.position);
      this.config.model.visible = true;
      this.modelPlaced = true;
      
      // Hide reticle
      this.reticle.visible = false;
      
      console.log('✅ Model placed in AR');
    }
  }

  /**
   * Update à chaque frame (hit test)
   */
  updateFrame(frame: XRFrame): void {
    if (!this.config.enableHitTest || !this.hitTestSource || !this.referenceSpace) {
      return;
    }
    
    // Perform hit test
    const hitTestResults = frame.getHitTestResults(this.hitTestSource);
    
    if (hitTestResults.length > 0 && this.reticle) {
      const hit = hitTestResults[0];
      const pose = hit.getPose(this.referenceSpace);
      
      if (pose) {
        // Update reticle position
        this.reticle.visible = true;
        this.reticle.matrix.fromArray(pose.transform.matrix);
        this.reticle.matrix.decompose(
          this.reticle.position,
          this.reticle.quaternion,
          this.reticle.scale
        );
      }
    } else if (this.reticle) {
      this.reticle.visible = false;
    }
  }

  /**
   * Obtient la session
   */
  getSession(): XRSession | null {
    return this.session;
  }

  /**
   * Vérifie si une session est active
   */
  isSessionActive(): boolean {
    return this.session !== null;
  }
}

