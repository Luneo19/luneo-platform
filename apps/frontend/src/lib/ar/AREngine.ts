/**
 * @fileoverview Moteur AR principal - Orchestrateur des différents trackers
 * @module AREngine
 *
 * FONCTIONNALITÉS:
 * - Initialisation caméra
 * - Gestion des trackers (face, hand, body)
 * - Rendu Three.js superposé
 * - Capture d'écran / vidéo
 *
 * RÈGLES RESPECTÉES:
 * - ✅ Types explicites
 * - ✅ Gestion d'erreurs
 * - ✅ Cleanup des ressources
 */

import * as THREE from 'three';
import { FaceTracker } from './trackers/FaceTracker';
import { HandTracker } from './trackers/HandTracker';
import { BodyTracker } from './trackers/BodyTracker';

// ============================================================================
// TYPES
// ============================================================================

export type TrackerType = 'face' | 'hand' | 'body';

export interface AREngineConfig {
  videoElement: HTMLVideoElement;
  canvasElement: HTMLCanvasElement;
  trackerType: TrackerType;
  onTrackingUpdate?: (data: TrackingData) => void;
  onError?: (error: Error) => void;
}

export interface TrackingData {
  type: TrackerType;
  landmarks: number[][];
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ARProduct {
  id: string;
  modelUrl: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: THREE.Vector3;
  attachmentPoint: string; // ex: 'ring_finger', 'left_ear', 'wrist'
}

// ============================================================================
// AR ENGINE CLASS
// ============================================================================

export class AREngine {
  private config: AREngineConfig;
  private isRunning = false;
  private animationFrameId: number | null = null;

  // Three.js
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private renderer: THREE.WebGLRenderer | null = null;

  // Trackers
  private faceTracker: FaceTracker | null = null;
  private handTracker: HandTracker | null = null;
  private bodyTracker: BodyTracker | null = null;
  private activeTracker: FaceTracker | HandTracker | BodyTracker | null = null;

  // Products
  private loadedProducts: Map<string, THREE.Object3D> = new Map();

  constructor(config: AREngineConfig) {
    this.config = config;
  }

  /**
   * Initialise le moteur AR
   */
  async initialize(): Promise<void> {
    try {
      // 1. Initialiser la caméra
      await this.initCamera();

      // 2. Initialiser Three.js
      this.initThreeJS();

      // 3. Initialiser le tracker approprié
      await this.initTracker(this.config.trackerType);

      console.log('[AREngine] Initialized successfully');
    } catch (error) {
      console.error('[AREngine] Initialization failed:', error);
      this.config.onError?.(error instanceof Error ? error : new Error('Unknown error'));
      throw error;
    }
  }

  /**
   * Initialise la caméra
   */
  private async initCamera(): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      this.config.videoElement.srcObject = stream;
      await this.config.videoElement.play();

      console.log('[AREngine] Camera initialized');
    } catch (error) {
      throw new Error(`Camera access denied: ${error}`);
    }
  }

  /**
   * Initialise Three.js
   */
  private initThreeJS(): void {
    const { canvasElement, videoElement } = this.config;

    // Scene
    this.scene = new THREE.Scene();

    // Camera (perspective matching video)
    const aspect = videoElement.videoWidth / videoElement.videoHeight;
    this.camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    this.camera.position.z = 5;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvasElement,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(videoElement.videoWidth, videoElement.videoHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);

    console.log('[AREngine] Three.js initialized');
  }

  /**
   * Initialise le tracker approprié
   */
  private async initTracker(type: TrackerType): Promise<void> {
    switch (type) {
      case 'face':
        this.faceTracker = new FaceTracker();
        await this.faceTracker.initialize();
        this.activeTracker = this.faceTracker;
        break;

      case 'hand':
        this.handTracker = new HandTracker();
        await this.handTracker.initialize();
        this.activeTracker = this.handTracker;
        break;

      case 'body':
        this.bodyTracker = new BodyTracker();
        await this.bodyTracker.initialize();
        this.activeTracker = this.bodyTracker;
        break;

      default:
        throw new Error(`Unknown tracker type: ${type}`);
    }

    console.log(`[AREngine] ${type} tracker initialized`);
  }

  /**
   * Démarre la boucle de rendu AR
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.renderLoop();
    console.log('[AREngine] Started');
  }

  /**
   * Arrête la boucle de rendu
   */
  stop(): void {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    console.log('[AREngine] Stopped');
  }

  /**
   * Boucle de rendu principale
   */
  private renderLoop = async (): Promise<void> => {
    if (!this.isRunning) return;

    try {
      // 1. Détecter les landmarks
      const trackingData = await this.activeTracker?.detect(this.config.videoElement);

      if (trackingData) {
        // 2. Notifier l'application
        this.config.onTrackingUpdate?.(trackingData);

        // 3. Mettre à jour les positions des produits 3D
        this.updateProductPositions(trackingData);
      }

      // 4. Rendu Three.js
      if (this.renderer && this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera);
      }
    } catch (error) {
      console.error('[AREngine] Render error:', error);
    }

    // Continuer la boucle
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  /**
   * Charge un produit 3D
   */
  async loadProduct(product: ARProduct): Promise<void> {
    const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        product.modelUrl,
        (gltf) => {
          const model = gltf.scene;
          model.position.copy(product.position);
          model.rotation.copy(product.rotation);
          model.scale.copy(product.scale);
          model.userData.attachmentPoint = product.attachmentPoint;

          this.scene?.add(model);
          this.loadedProducts.set(product.id, model);

          console.log(`[AREngine] Product loaded: ${product.id}`);
          resolve();
        },
        undefined,
        (error) => {
          console.error(`[AREngine] Failed to load product: ${product.id}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Retire un produit 3D
   */
  removeProduct(productId: string): void {
    const model = this.loadedProducts.get(productId);
    if (model) {
      this.scene?.remove(model);
      this.loadedProducts.delete(productId);
      console.log(`[AREngine] Product removed: ${productId}`);
    }
  }

  /**
   * Met à jour les positions des produits selon le tracking
   */
  private updateProductPositions(trackingData: TrackingData): void {
    this.loadedProducts.forEach((model) => {
      const attachmentPoint = model.userData.attachmentPoint;
      const position = this.getAttachmentPosition(trackingData, attachmentPoint);

      if (position) {
        model.position.set(position.x, position.y, position.z);
        // TODO: Mettre à jour la rotation selon l'orientation du visage/main
      }
    });
  }

  /**
   * Calcule la position d'un point d'attache
   */
  private getAttachmentPosition(
    trackingData: TrackingData,
    attachmentPoint: string
  ): THREE.Vector3 | null {
    const { landmarks } = trackingData;

    // Mapping des points d'attache vers les indices de landmarks
    const attachmentMap: Record<string, number> = {
      // Face
      'left_ear': 234,
      'right_ear': 454,
      'nose': 1,
      'left_eye': 33,
      'right_eye': 263,
      'forehead': 10,
      // Hand
      'ring_finger': 16,
      'middle_finger': 12,
      'index_finger': 8,
      'wrist': 0,
      // Body
      'left_shoulder': 11,
      'right_shoulder': 12,
      'neck': 0, // Calculé
    };

    const landmarkIndex = attachmentMap[attachmentPoint];
    if (landmarkIndex === undefined || !landmarks[landmarkIndex]) {
      return null;
    }

    const [x, y, z] = landmarks[landmarkIndex];

    // Convertir les coordonnées normalisées en coordonnées 3D
    return new THREE.Vector3(
      (x - 0.5) * 10,  // Centré, échelle arbitraire
      -(y - 0.5) * 10, // Inverser Y
      -z * 2           // Profondeur
    );
  }

  /**
   * Capture une image
   */
  captureImage(): string {
    if (!this.renderer) {
      throw new Error('Renderer not initialized');
    }

    // Créer un canvas composite
    const compositeCanvas = document.createElement('canvas');
    const ctx = compositeCanvas.getContext('2d');
    if (!ctx) throw new Error('Could not get 2D context');

    compositeCanvas.width = this.config.videoElement.videoWidth;
    compositeCanvas.height = this.config.videoElement.videoHeight;

    // Dessiner la vidéo
    ctx.drawImage(this.config.videoElement, 0, 0);

    // Dessiner le rendu Three.js par-dessus
    ctx.drawImage(this.config.canvasElement, 0, 0);

    return compositeCanvas.toDataURL('image/png');
  }

  /**
   * Change le type de tracker
   */
  async switchTracker(type: TrackerType): Promise<void> {
    this.stop();
    await this.initTracker(type);
    this.start();
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    this.stop();

    // Arrêter la caméra
    const stream = this.config.videoElement.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());

    // Nettoyer Three.js
    this.loadedProducts.forEach((model) => {
      this.scene?.remove(model);
    });
    this.loadedProducts.clear();

    this.renderer?.dispose();

    // Nettoyer les trackers
    this.faceTracker?.dispose();
    this.handTracker?.dispose();
    this.bodyTracker?.dispose();

    console.log('[AREngine] Disposed');
  }
}
