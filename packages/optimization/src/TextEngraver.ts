/**
 * @luneo/optimization - Text Engraver professionnel
 * Gravure 3D text sur surfaces
 */

import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader';

/**
 * Options de texte 3D
 */
export interface TextOptions {
  /** Texte à graver */
  text: string;
  
  /** Nom de la font */
  fontName?: string;
  
  /** Taille du texte */
  size?: number;
  
  /** Profondeur (height en Three.js) */
  depth?: number;
  
  /** Couleur */
  color?: string | number;
  
  /** Activer bevel */
  bevel?: boolean;
  
  /** Épaisseur du bevel */
  bevelThickness?: number;
  
  /** Taille du bevel */
  bevelSize?: number;
  
  /** Segments de courbe */
  curveSegments?: number;
}

/**
 * Fonts disponibles
 */
export const AVAILABLE_FONTS = {
  helvetiker: '/fonts/helvetiker_regular.typeface.json',
  helvetiker_bold: '/fonts/helvetiker_bold.typeface.json',
  optimer: '/fonts/optimer_regular.typeface.json',
  optimer_bold: '/fonts/optimer_bold.typeface.json',
  gentilis: '/fonts/gentilis_regular.typeface.json',
  gentilis_bold: '/fonts/gentilis_bold.typeface.json',
  droid_sans: '/fonts/droid_sans_regular.typeface.json',
  droid_sans_bold: '/fonts/droid_sans_bold.typeface.json',
};

/**
 * Text Engraver professionnel
 * 
 * Features:
 * - Multiple fonts support
 * - 3D text geometry
 * - Bevel & extrude
 * - Surface placement
 * - Curved text (follow surface)
 * 
 * @example
 * ```typescript
 * const engraver = new TextEngraver();
 * 
 * await engraver.loadFont('helvetiker_bold');
 * 
 * const textMesh = await engraver.create3DText({
 *   text: 'LUNEO',
 *   size: 0.5,
 *   depth: 0.1,
 *   color: '#FFD700',
 *   bevel: true
 * });
 * 
 * scene.add(textMesh);
 * ```
 */
export class TextEngraver {
  private fontLoader: FontLoader;
  private fontsCache: Map<string, Font> = new Map();
  private materialsCache: Map<string, THREE.Material> = new Map();

  constructor() {
    this.fontLoader = new FontLoader();
  }

  /**
   * Charge une font
   */
  async loadFont(fontName: string): Promise<Font> {
    // Check cache
    if (this.fontsCache.has(fontName)) {
      return this.fontsCache.get(fontName)!;
    }
    
    const fontUrl = AVAILABLE_FONTS[fontName as keyof typeof AVAILABLE_FONTS];
    if (!fontUrl) {
      throw new Error(`Font '${fontName}' not found. Available: ${Object.keys(AVAILABLE_FONTS).join(', ')}`);
    }
    
    console.log(`📝 Loading font: ${fontName}...`);
    
    return new Promise((resolve, reject) => {
      this.fontLoader.load(
        fontUrl,
        (font) => {
          this.fontsCache.set(fontName, font);
          console.log(`✅ Font loaded: ${fontName}`);
          resolve(font);
        },
        undefined,
        (error) => {
          console.error(`Failed to load font: ${fontName}`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Créer texte 3D
   */
  async create3DText(options: TextOptions): Promise<THREE.Mesh> {
    const config = {
      text: options.text,
      fontName: options.fontName || 'helvetiker',
      size: options.size || 0.5,
      depth: options.depth || 0.1,
      color: options.color || '#ffffff',
      bevel: options.bevel !== false,
      bevelThickness: options.bevelThickness || 0.02,
      bevelSize: options.bevelSize || 0.01,
      curveSegments: options.curveSegments || 12,
    };
    
    // Load font
    const font = await this.loadFont(config.fontName);
    
    // Create geometry
    const geometry = new TextGeometry(config.text, {
      font: font,
      size: config.size,
      height: config.depth,
      curveSegments: config.curveSegments,
      bevelEnabled: config.bevel,
      bevelThickness: config.bevelThickness,
      bevelSize: config.bevelSize,
      bevelSegments: 3,
    });
    
    // Center geometry
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      const centerX = -(geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2;
      const centerY = -(geometry.boundingBox.max.y - geometry.boundingBox.min.y) / 2;
      geometry.translate(centerX, centerY, 0);
    }
    
    // Create material
    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      metalness: 0.5,
      roughness: 0.5,
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    
    return mesh;
  }

  /**
   * Placer texte sur une surface
   */
  placeOnSurface(
    textMesh: THREE.Mesh,
    surface: THREE.Mesh,
    position2D: THREE.Vector2,
    camera: THREE.Camera
  ): void {
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(position2D, camera);
    
    const intersects = raycaster.intersectObject(surface);
    
    if (intersects.length > 0) {
      const intersect = intersects[0];
      
      // Position
      textMesh.position.copy(intersect.point);
      
      // Rotation (normal de la surface)
      if (intersect.face) {
        const normal = intersect.face.normal.clone();
        normal.transformDirection(surface.matrixWorld);
        textMesh.lookAt(textMesh.position.clone().add(normal));
      }
    }
  }

  /**
   * Créer texte courbé (follow curve)
   */
  createCurvedText(
    options: TextOptions,
    curve: THREE.Curve<THREE.Vector3>
  ): THREE.Group {
    const group = new THREE.Group();
    const text = options.text;
    
    // Créer un caractère à la fois et positionner sur la courbe
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const t = i / (text.length - 1 || 1);
      
      // Position sur la courbe
      const point = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t);
      
      // Créer geometry pour le caractère
      // (Simplified - en production utiliser TextGeometry pour chaque char)
      const charMesh = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, options.depth || 0.05),
        new THREE.MeshStandardMaterial({ color: options.color || '#ffffff' })
      );
      
      charMesh.position.copy(point);
      charMesh.lookAt(point.clone().add(tangent));
      
      group.add(charMesh);
    }
    
    return group;
  }

  /**
   * Change le texte d'un mesh existant
   */
  async updateText(mesh: THREE.Mesh, newText: string, options: TextOptions): Promise<void> {
    // Dispose old geometry
    mesh.geometry.dispose();
    
    // Create new text
    const newMesh = await this.create3DText({ ...options, text: newText });
    
    // Replace geometry
    mesh.geometry = newMesh.geometry;
    mesh.material = newMesh.material;
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    this.materialsCache.forEach(mat => mat.dispose());
    this.materialsCache.clear();
    
    this.fontsCache.clear();
    
    console.log('TextEngraver disposed');
  }
}

