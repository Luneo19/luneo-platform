/**
 * @luneo/virtual-try-on - Types professionnels
 * Architecture type-safe pour Virtual Try-On
 */

import type * as THREE from 'three';

/**
 * Configuration principale du Virtual Try-On
 */
export interface VirtualTryOnConfig {
  /** Container HTML pour le rendu */
  container: HTMLElement;
  
  /** Catégorie de produit */
  category: ProductCategory;
  
  /** URL du modèle 3D (GLB/GLTF) */
  model3dUrl: string;
  
  /** Options de caméra */
  cameraOptions?: CameraOptions;
  
  /** Options de rendu */
  renderOptions?: RenderOptions;
  
  /** Mode debug */
  debug?: boolean;
}

/**
 * Catégories de produits supportées
 */
export type ProductCategory = 'glasses' | 'watch' | 'jewelry';

/**
 * Options de caméra
 */
export interface CameraOptions {
  /** Caméra facingMode ('user' pour selfie, 'environment' pour arrière) */
  facingMode?: 'user' | 'environment';
  
  /** Résolution préférée */
  width?: number;
  height?: number;
  
  /** Frame rate cible */
  frameRate?: number;
}

/**
 * Options de rendu Three.js
 */
export interface RenderOptions {
  /** Activer antialiasing */
  antialias?: boolean;
  
  /** Activer ombres */
  shadows?: boolean;
  
  /** Intensité lumière ambiante */
  ambientLightIntensity?: number;
}

/**
 * Résultats de tracking facial (MediaPipe Face Mesh)
 */
export interface FaceTrackingResult {
  /** 468 landmarks du visage */
  landmarks: FaceLandmark[];
  
  /** Transformation matrice 4x4 */
  transform: THREE.Matrix4;
  
  /** Confiance de détection (0-1) */
  confidence: number;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * Point de landmark facial
 */
export interface FaceLandmark {
  /** Position X normalisée (0-1) */
  x: number;
  
  /** Position Y normalisée (0-1) */
  y: number;
  
  /** Profondeur Z normalisée */
  z: number;
  
  /** Visibilité (0-1) */
  visibility?: number;
}

/**
 * Résultats de tracking main (MediaPipe Hands)
 */
export interface HandTrackingResult {
  /** Main gauche ou droite */
  handedness: 'Left' | 'Right';
  
  /** 21 landmarks de la main */
  landmarks: HandLandmark[];
  
  /** Transformation matrice 4x4 */
  transform: THREE.Matrix4;
  
  /** Confiance de détection (0-1) */
  confidence: number;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * Point de landmark main
 */
export interface HandLandmark {
  /** Position X normalisée (0-1) */
  x: number;
  
  /** Position Y normalisée (0-1) */
  y: number;
  
  /** Profondeur Z normalisée */
  z: number;
}

/**
 * Points d'ancrage spécifiques pour lunettes
 */
export interface GlassesAnchorPoints {
  /** Pont du nez */
  noseBridge: THREE.Vector3;
  
  /** Tempe gauche */
  leftTemple: THREE.Vector3;
  
  /** Tempe droite */
  rightTemple: THREE.Vector3;
  
  /** Rotation calculée */
  rotation: THREE.Euler;
  
  /** Échelle calculée */
  scale: number;
}

/**
 * Points d'ancrage spécifiques pour montre
 */
export interface WatchAnchorPoints {
  /** Poignet */
  wrist: THREE.Vector3;
  
  /** Centre paume */
  palmCenter: THREE.Vector3;
  
  /** Rotation calculée */
  rotation: THREE.Euler;
  
  /** Échelle calculée */
  scale: number;
}

/**
 * État du Virtual Try-On
 */
export type VirtualTryOnState = 
  | 'idle'           // Non initialisé
  | 'initializing'   // En cours d'initialisation
  | 'ready'          // Prêt à démarrer
  | 'running'        // En cours d'exécution
  | 'paused'         // En pause
  | 'error';         // Erreur

/**
 * Événements du Virtual Try-On
 */
export interface VirtualTryOnEvents {
  /** Caméra initialisée */
  'camera:ready': () => void;
  
  /** Face détectée */
  'face:detected': (result: FaceTrackingResult) => void;
  
  /** Face perdue */
  'face:lost': () => void;
  
  /** Main détectée */
  'hand:detected': (result: HandTrackingResult) => void;
  
  /** Main perdue */
  'hand:lost': () => void;
  
  /** Modèle 3D chargé */
  'model:loaded': (model: THREE.Object3D) => void;
  
  /** FPS update */
  'performance:fps': (fps: number) => void;
  
  /** Erreur */
  'error': (error: Error) => void;
}

/**
 * Métriques de performance
 */
export interface PerformanceMetrics {
  /** FPS moyen */
  averageFPS: number;
  
  /** FPS min */
  minFPS: number;
  
  /** FPS max */
  maxFPS: number;
  
  /** Temps de frame moyen (ms) */
  averageFrameTime: number;
  
  /** Utilisation mémoire (MB) */
  memoryUsage: number;
  
  /** Nombre de frames rendus */
  framesRendered: number;
}

/**
 * Options de screenshot
 */
export interface ScreenshotOptions {
  /** Format de sortie */
  format?: 'png' | 'jpeg' | 'webp';
  
  /** Qualité (0-1 pour JPEG/WebP) */
  quality?: number;
  
  /** Largeur de sortie */
  width?: number;
  
  /** Hauteur de sortie */
  height?: number;
}

/**
 * Résultat de screenshot
 */
export interface ScreenshotResult {
  /** Data URL de l'image */
  dataUrl: string;
  
  /** Blob de l'image */
  blob: Blob;
  
  /** Dimensions */
  width: number;
  height: number;
  
  /** Timestamp */
  timestamp: number;
}

/**
 * Configuration de log
 */
export interface LoggerConfig {
  /** Niveau de log */
  level: 'debug' | 'info' | 'warn' | 'error';
  
  /** Préfixe des logs */
  prefix?: string;
  
  /** Activer timestamp */
  timestamp?: boolean;
}

/**
 * Erreur structurée
 */
export interface VirtualTryOnError extends Error {
  /** Code erreur */
  code: string;
  
  /** Catégorie */
  category: 'camera' | 'tracking' | 'rendering' | 'model' | 'network';
  
  /** Détails additionnels */
  details?: Record<string, any>;
  
  /** Est-ce récupérable ? */
  recoverable: boolean;
}

