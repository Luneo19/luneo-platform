/**
 * ★★★ MOTEUR AR - SCENE WEBXR ★★★
 * Gère toute l'expérience AR
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { FaceDetector } from "../detectors/FaceDetector";
import { HandDetector } from "../detectors/HandDetector";
import { GlassesPlacement } from "../placement/GlassesPlacement";
import { JewelryPlacement } from "../placement/JewelryPlacement";

export type ProductType = "glasses" | "earrings" | "necklace" | "bracelet" | "ring" | "watch";

export interface ARSceneConfig {
  modelUrl: string;
  productType: ProductType;
  enableFaceTracking?: boolean;
  enableHandTracking?: boolean;
}

export class ARScene {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private xrSession: XRSession | null = null;
  
  private faceDetector: FaceDetector | null = null;
  private handDetector: HandDetector | null = null;
  
  private productMesh: THREE.Group | null = null;
  private productType: ProductType;
  
  private animationFrameId: number | null = null;
  
  constructor(private config: ARSceneConfig) {
    this.productType = config.productType;
    
    // Init Three.js
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    
    this.renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.xr.enabled = true;
    
    this.setupLighting();
  }
  
  async initialize(): Promise<void> {
    // Charge modèle 3D
    await this.loadProduct();
    
    // Init détecteurs selon type produit
    if (this.requiresFaceTracking()) {
      this.faceDetector = new FaceDetector();
      await this.faceDetector.initialize();
    }
    
    if (this.requiresHandTracking()) {
      this.handDetector = new HandDetector();
      await this.handDetector.initialize();
    }
  }
  
  async startARSession(): Promise<void> {
    if (!("xr" in navigator)) {
      throw new Error("WebXR non supporté");
    }
    
    const xr = (navigator as any).xr;
    const supported = await xr.isSessionSupported("immersive-ar");
    
    if (!supported) {
      throw new Error("AR non supportée sur cet appareil");
    }
    
    this.xrSession = await xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      optionalFeatures: ["dom-overlay"],
    });
    
    await this.renderer.xr.setSession(this.xrSession);
    
    // Start render loop
    this.renderer.setAnimationLoop(this.render.bind(this));
  }
  
  private async loadProduct(): Promise<void> {
    const loader = new GLTFLoader();
    
    return new Promise((resolve, reject) => {
      loader.load(
        this.config.modelUrl,
        (gltf) => {
          this.productMesh = gltf.scene;
          
          // Scale selon type
          const scales: Record<ProductType, number> = {
            glasses: 0.15,
            earrings: 0.08,
            necklace: 0.2,
            bracelet: 0.12,
            ring: 0.05,
            watch: 0.1
          };
          
          const scale = scales[this.productType] || 0.1;
          this.productMesh.scale.set(scale, scale, scale);
          
          this.scene.add(this.productMesh);
          resolve();
        },
        undefined,
        reject
      );
    });
  }
  
  private setupLighting(): void {
    // Ambient light
    const ambient = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambient);
    
    // Directional light
    const directional = new THREE.DirectionalLight(0xffffff, 0.8);
    directional.position.set(1, 2, 3);
    this.scene.add(directional);
    
    // Hemisphere light for realistic outdoor look
    const hemisphere = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
    this.scene.add(hemisphere);
  }
  
  private render(time: number, frame?: XRFrame): void {
    if (!this.productMesh) return;
    
    // Update détecteurs
    if (this.faceDetector && this.requiresFaceTracking()) {
      const faceLandmarks = this.faceDetector.detect();
      
      if (faceLandmarks) {
        this.updateProductPosition(faceLandmarks);
      }
    }
    
    if (this.handDetector && this.requiresHandTracking()) {
      const handLandmarks = this.handDetector.detect();
      
      if (handLandmarks) {
        this.updateProductPosition(handLandmarks);
      }
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  private updateProductPosition(landmarks: any): void {
    if (!this.productMesh) return;
    
    switch (this.productType) {
      case "glasses":
        GlassesPlacement.update(this.productMesh, landmarks);
        break;
      case "bracelet":
      case "watch":
        JewelryPlacement.updateWrist(this.productMesh, landmarks);
        break;
      case "ring":
        JewelryPlacement.updateRing(this.productMesh, landmarks);
        break;
      case "earrings":
        JewelryPlacement.updateEarrings(this.productMesh, landmarks);
        break;
      case "necklace":
        JewelryPlacement.updateNecklace(this.productMesh, landmarks);
        break;
    }
  }
  
  private requiresFaceTracking(): boolean {
    return ["glasses", "earrings", "necklace"].includes(this.productType);
  }
  
  private requiresHandTracking(): boolean {
    return ["bracelet", "ring", "watch"].includes(this.productType);
  }
  
  public stopARSession(): void {
    if (this.xrSession) {
      this.xrSession.end();
      this.xrSession = null;
    }
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.faceDetector?.stop();
    this.handDetector?.stop();
  }
  
  public getDOMElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }
}

