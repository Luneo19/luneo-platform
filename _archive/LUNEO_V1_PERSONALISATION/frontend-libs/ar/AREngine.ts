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
import { logger } from '@/lib/logger';

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

      logger.info('[AREngine] Initialized successfully');
    } catch (error) {
      logger.error('[AREngine] Initialization failed:', error);
      this.config.onError?.(
        error instanceof Error ? error : new Error('Unknown error')
      );
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

      logger.info('[AREngine] Camera initialized');
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

    logger.info('[AREngine] Three.js initialized');
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

    logger.info(`[AREngine] ${type} tracker initialized`);
  }

  /**
   * Démarre la boucle de rendu AR
   */
  start(): void {
    if (this.isRunning) return;
    this.isRunning = true;
    this.renderLoop();
    logger.info('[AREngine] Started');
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
    logger.info('[AREngine] Stopped');
  }

  /**
   * Boucle de rendu principale
   */
  private renderLoop = async (): Promise<void> => {
    if (!this.isRunning) return;

    try {
      // 1. Détecter les landmarks
      const trackingData = await this.activeTracker?.detect(
        this.config.videoElement
      );

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
      logger.error('[AREngine] Render error:', error);
    }

    // Continuer la boucle
    this.animationFrameId = requestAnimationFrame(this.renderLoop);
  };

  /**
   * Charge un produit 3D
   */
  async loadProduct(product: ARProduct): Promise<void> {
    const { GLTFLoader } =
      await import('three/examples/jsm/loaders/GLTFLoader.js');
    const loader = new GLTFLoader();

    return new Promise((resolve, reject) => {
      loader.load(
        product.modelUrl,
        gltf => {
          const model = gltf.scene;
          model.position.copy(product.position);
          model.rotation.copy(product.rotation);
          model.scale.copy(product.scale);
          model.userData.attachmentPoint = product.attachmentPoint;

          this.scene?.add(model);
          this.loadedProducts.set(product.id, model);

          logger.info(`[AREngine] Product loaded: ${product.id}`);
          resolve();
        },
        undefined,
        error => {
          logger.error(
            `[AREngine] Failed to load product: ${product.id}`,
            error
          );
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
      logger.info(`[AREngine] Product removed: ${productId}`);
    }
  }

  /**
   * Met à jour les positions et rotations des produits selon le tracking
   */
  private updateProductPositions(trackingData: TrackingData): void {
    this.loadedProducts.forEach(model => {
      const attachmentPoint = model.userData.attachmentPoint;
      const position = this.getAttachmentPosition(
        trackingData,
        attachmentPoint
      );

      if (position) {
        model.position.set(position.x, position.y, position.z);
        
        // Calculer et appliquer la rotation selon l'orientation
        const rotation = this.getAttachmentRotation(trackingData, attachmentPoint);
        if (rotation) {
          model.rotation.set(rotation.x, rotation.y, rotation.z);
        }
        
        // Calculer et appliquer le scale selon la distance/taille
        const scale = this.getAttachmentScale(trackingData, attachmentPoint);
        if (scale > 0) {
          model.scale.setScalar(scale);
        }
      }
    });
  }

  /**
   * Calcule la rotation pour un point d'attache
   */
  private getAttachmentRotation(
    trackingData: TrackingData,
    attachmentPoint: string
  ): THREE.Euler | null {
    const { landmarks, type } = trackingData;
    
    if (type === 'face') {
      return this.getFaceRotation(landmarks, attachmentPoint);
    } else if (type === 'hand') {
      return this.getHandRotation(landmarks, attachmentPoint);
    }
    
    return null;
  }

  /**
   * Calcule la rotation du visage basée sur les landmarks
   */
  private getFaceRotation(landmarks: number[][], attachmentPoint: string): THREE.Euler | null {
    if (landmarks.length < 468) return null;
    
    // Points clés pour calculer l'orientation du visage
    const noseTip = landmarks[1];       // Bout du nez
    const noseBridge = landmarks[6];    // Haut du nez
    const leftEye = landmarks[33];      // Coin externe œil gauche
    const rightEye = landmarks[263];    // Coin externe œil droit
    const chin = landmarks[152];        // Menton
    
    if (!noseTip || !noseBridge || !leftEye || !rightEye || !chin) {
      return null;
    }
    
    // Calculer le yaw (rotation horizontale) basé sur la position relative des yeux
    const eyeCenter = [(leftEye[0] + rightEye[0]) / 2, (leftEye[1] + rightEye[1]) / 2];
    const yaw = Math.atan2(noseTip[0] - eyeCenter[0], 0.3) * 2;
    
    // Calculer le pitch (rotation verticale) basé sur l'axe nez-menton
    const faceHeight = Math.sqrt(
      Math.pow(chin[0] - noseBridge[0], 2) + Math.pow(chin[1] - noseBridge[1], 2)
    );
    const pitch = Math.atan2(noseTip[1] - noseBridge[1], faceHeight) - Math.PI / 2;
    
    // Calculer le roll (inclinaison) basé sur l'angle des yeux
    const roll = Math.atan2(rightEye[1] - leftEye[1], rightEye[0] - leftEye[0]);
    
    // Ajustements selon le point d'attache
    let rotationOffset = { x: 0, y: 0, z: 0 };
    
    if (attachmentPoint === 'left_ear' || attachmentPoint === 'right_ear') {
      // Boucles d'oreilles : suivre l'inclinaison de la tête
      rotationOffset = { x: 0, y: attachmentPoint === 'left_ear' ? 0.3 : -0.3, z: 0 };
    } else if (attachmentPoint.includes('eye')) {
      // Lunettes : alignées avec les yeux
      rotationOffset = { x: 0, y: 0, z: 0 };
    } else if (attachmentPoint === 'nose') {
      // Piercings de nez : suivre l'orientation du nez
      rotationOffset = { x: pitch * 0.5, y: 0, z: 0 };
    }
    
    return new THREE.Euler(
      pitch + rotationOffset.x,
      yaw + rotationOffset.y,
      roll + rotationOffset.z
    );
  }

  /**
   * Calcule la rotation de la main basée sur les landmarks
   */
  private getHandRotation(landmarks: number[][], attachmentPoint: string): THREE.Euler | null {
    if (landmarks.length < 21) return null;
    
    // Points clés de la main
    const wrist = landmarks[0];
    const indexMcp = landmarks[5];
    const middleMcp = landmarks[9];
    const pinkyMcp = landmarks[17];
    
    if (!wrist || !indexMcp || !middleMcp || !pinkyMcp) {
      return null;
    }
    
    // Direction principale de la main (poignet vers doigts)
    const handDirection = {
      x: middleMcp[0] - wrist[0],
      y: middleMcp[1] - wrist[1],
      z: (middleMcp[2] || 0) - (wrist[2] || 0),
    };
    
    // Rotation de la paume (index vers auriculaire)
    const palmDirection = {
      x: pinkyMcp[0] - indexMcp[0],
      y: pinkyMcp[1] - indexMcp[1],
    };
    
    // Calculer les angles
    const pitch = Math.atan2(handDirection.y, Math.sqrt(handDirection.x ** 2 + handDirection.z ** 2));
    const yaw = Math.atan2(handDirection.x, handDirection.z || 0.1);
    const roll = Math.atan2(palmDirection.y, palmDirection.x);
    
    // Ajustements selon le point d'attache
    if (attachmentPoint.includes('finger')) {
      // Bagues : rotation alignée avec le doigt
      const fingerMap: Record<string, { base: number; tip: number }> = {
        index_finger: { base: 5, tip: 8 },
        middle_finger: { base: 9, tip: 12 },
        ring_finger: { base: 13, tip: 16 },
        pinky_finger: { base: 17, tip: 20 },
      };
      
      const finger = fingerMap[attachmentPoint];
      if (finger && landmarks[finger.base] && landmarks[finger.tip]) {
        const base = landmarks[finger.base];
        const tip = landmarks[finger.tip];
        const fingerAngle = Math.atan2(tip[1] - base[1], tip[0] - base[0]);
        return new THREE.Euler(0, 0, fingerAngle + Math.PI / 2);
      }
    } else if (attachmentPoint === 'wrist') {
      // Bracelet/montre : rotation alignée avec le poignet
      return new THREE.Euler(pitch, yaw, roll);
    }
    
    return new THREE.Euler(pitch * 0.5, yaw * 0.5, roll);
  }

  /**
   * Calcule le scale pour un point d'attache (basé sur la distance/taille)
   */
  private getAttachmentScale(
    trackingData: TrackingData,
    attachmentPoint: string
  ): number {
    const { landmarks, type, boundingBox } = trackingData;
    
    if (!boundingBox) return 1;
    
    // Scale basé sur la taille de la zone détectée
    const baseScale = type === 'face' 
      ? boundingBox.width * 3  // Visage : utiliser largeur
      : boundingBox.width * 2; // Main : utiliser largeur
    
    // Ajustements par type d'attache
    const scaleFactors: Record<string, number> = {
      left_ear: 0.15,
      right_ear: 0.15,
      nose: 0.08,
      left_eye: 0.3,
      right_eye: 0.3,
      forehead: 0.25,
      ring_finger: 0.12,
      middle_finger: 0.12,
      index_finger: 0.12,
      wrist: 0.4,
    };
    
    const factor = scaleFactors[attachmentPoint] || 0.2;
    return Math.max(0.1, Math.min(2, baseScale * factor));
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
      // Face (MediaPipe Face Mesh indices)
      left_ear: 234,
      right_ear: 454,
      nose: 1,
      left_eye: 33,
      right_eye: 263,
      forehead: 10,
      chin: 152,
      // Hand (MediaPipe Hands indices)
      ring_finger: 14,   // Ring PIP (zone de la bague)
      middle_finger: 10, // Middle PIP
      index_finger: 6,   // Index PIP
      pinky_finger: 18,  // Pinky PIP
      wrist: 0,
      // Body
      left_shoulder: 11,
      right_shoulder: 12,
      neck: 0,
    };

    const landmarkIndex = attachmentMap[attachmentPoint];
    if (landmarkIndex === undefined || !landmarks[landmarkIndex]) {
      return null;
    }

    const [x, y, z] = landmarks[landmarkIndex];

    // Convertir les coordonnées normalisées (0-1) en coordonnées 3D
    return new THREE.Vector3(
      (x - 0.5) * 10,   // Centré, échelle arbitraire
      -(y - 0.5) * 10,  // Inverser Y (écran vs 3D)
      -(z || 0) * 2     // Profondeur (négatif pour aller vers la caméra)
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
    this.loadedProducts.forEach(model => {
      this.scene?.remove(model);
    });
    this.loadedProducts.clear();

    this.renderer?.dispose();

    // Nettoyer les trackers
    this.faceTracker?.dispose();
    this.handTracker?.dispose();
    this.bodyTracker?.dispose();

    logger.info('[AREngine] Disposed');
  }
}
