import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { Font, FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { Configurator3D } from '../core/Configurator3D';
import { logger } from '@/lib/logger';

export interface TextEngravingOptions {
  text: string;
  font?: string;
  size?: number;
  height?: number;
  curveSegments?: number;
  bevelEnabled?: boolean;
  bevelThickness?: number;
  bevelSize?: number;
  bevelSegments?: number;
  position?: THREE.Vector3;
  rotation?: THREE.Euler;
  color?: string;
  material?: 'engraved' | 'raised' | 'embossed' | 'cutout';
  depth?: number;
  metalness?: number;
  roughness?: number;
}

export class TextEngraver3D {
  private configurator: Configurator3D;
  private fontLoader: FontLoader;
  private loadedFonts: Map<string, Font> = new Map();
  private engravings: Map<string, THREE.Mesh> = new Map();

  // Pre-configured font paths
  private fontPaths: Map<string, string> = new Map([
    ['helvetiker', '/fonts/helvetiker_regular.typeface.json'],
    ['helvetiker-bold', '/fonts/helvetiker_bold.typeface.json'],
    ['optimer', '/fonts/optimer_regular.typeface.json'],
    ['optimer-bold', '/fonts/optimer_bold.typeface.json'],
    ['gentilis', '/fonts/gentilis_regular.typeface.json'],
    ['gentilis-bold', '/fonts/gentilis_bold.typeface.json'],
    ['droid-sans', '/fonts/droid_sans_regular.typeface.json'],
    ['droid-sans-bold', '/fonts/droid_sans_bold.typeface.json'],
    ['droid-serif', '/fonts/droid_serif_regular.typeface.json'],
  ]);

  constructor(configurator: Configurator3D) {
    this.configurator = configurator;
    this.fontLoader = new FontLoader();
  }

  async loadFont(fontName: string): Promise<Font> {
    // Check cache
    if (this.loadedFonts.has(fontName)) {
      return this.loadedFonts.get(fontName)!;
    }

    // Get font path
    const fontPath = this.fontPaths.get(fontName) || this.fontPaths.get('helvetiker')!;

    return new Promise((resolve, reject) => {
      this.fontLoader.load(
        fontPath,
        (font) => {
          this.loadedFonts.set(fontName, font);
          resolve(font);
        },
        undefined,
        (error) => {
          logger.error('Error loading font', {
            error,
            fontName,
            fontPath,
          });
          reject(error);
        }
      );
    });
  }

  async engraveText(options: TextEngravingOptions): Promise<string> {
    const {
      text,
      font = 'helvetiker',
      size = 0.1,
      height = 0.01,
      curveSegments = 12,
      bevelEnabled = false,
      bevelThickness = 0.001,
      bevelSize = 0.001,
      bevelSegments = 3,
      position = new THREE.Vector3(0, 0, 0),
      rotation = new THREE.Euler(0, 0, 0),
      color = '#000000',
      material = 'engraved',
      depth = 0.005,
      metalness = 0.5,
      roughness = 0.5,
    } = options;

    try {
      // Load font
      const loadedFont = await this.loadFont(font);

      // Create text geometry
      const textGeometry = new TextGeometry(text, {
        font: loadedFont,
        size,
        depth: height,
        curveSegments,
        bevelEnabled,
        bevelThickness,
        bevelSize,
        bevelSegments,
      });

      // Center geometry
      textGeometry.computeBoundingBox();
      const boundingBox = textGeometry.boundingBox!;
      const centerOffset = new THREE.Vector3(
        -(boundingBox.max.x - boundingBox.min.x) / 2,
        -(boundingBox.max.y - boundingBox.min.y) / 2,
        -(boundingBox.max.z - boundingBox.min.z) / 2
      );
      textGeometry.translate(centerOffset.x, centerOffset.y, centerOffset.z);

      // Create material based on engraving type
      let textMaterial: THREE.Material;

      switch (material) {
        case 'engraved':
          // Darker, indented appearance
          textMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color).multiplyScalar(0.5),
            metalness: metalness * 0.7,
            roughness: roughness * 1.3,
            emissive: new THREE.Color(color).multiplyScalar(0.05),
          });
          break;

        case 'raised':
          // Lighter, protruding appearance
          textMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color).multiplyScalar(1.2),
            metalness: metalness * 1.2,
            roughness: roughness * 0.8,
          });
          break;

        case 'embossed':
          // Metallic, raised appearance
          textMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            metalness: 0.9,
            roughness: 0.2,
            emissive: new THREE.Color(color).multiplyScalar(0.1),
          });
          break;

        case 'cutout':
          // Transparent cutout effect
          textMaterial = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(color),
            metalness: 0,
            roughness: 0.3,
            transmission: 0.9,
            thickness: 0.5,
          });
          break;

        default:
          textMaterial = new THREE.MeshStandardMaterial({
            color: new THREE.Color(color),
            metalness,
            roughness,
          });
      }

      // Create mesh
      const textMesh = new THREE.Mesh(textGeometry, textMaterial);
      textMesh.position.copy(position);
      textMesh.rotation.copy(rotation);
      textMesh.castShadow = true;
      textMesh.receiveShadow = true;

      if (material === 'engraved') {
        textMesh.position.z -= depth;
      } else if (material === 'raised') {
        textMesh.position.z += depth;
      }

      // Generate unique ID
      const engravingId = `engraving_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      textMesh.name = engravingId;

      // Add to scene
      const model = this.configurator.getModel();
      if (model) {
        model.add(textMesh);
      } else {
        this.configurator.getScene().add(textMesh);
      }

      // Store engraving
      this.engravings.set(engravingId, textMesh);

      return engravingId;
    } catch (error) {
      logger.error('Error engraving text', {
        error,
        text,
        font,
        material,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async updateEngraving(engravingId: string, options: Partial<TextEngravingOptions>): Promise<void> {
    const existingMesh = this.engravings.get(engravingId);
    
    if (!existingMesh) {
      throw new Error(`Engraving not found: ${engravingId}`);
    }

    // Remove old engraving
    this.removeEngraving(engravingId);

    // Create new engraving with updated options
    const currentOptions: TextEngravingOptions = {
      text: options.text || 'Text',
      font: options.font,
      size: options.size,
      height: options.height,
      position: options.position || existingMesh.position.clone(),
      rotation: options.rotation || existingMesh.rotation.clone(),
      color: options.color,
      material: options.material,
      ...options,
    };

    const newId = await this.engraveText(currentOptions);
    
    // Update reference
    this.engravings.delete(engravingId);
    const newMesh = this.engravings.get(newId);
    if (newMesh) {
      newMesh.name = engravingId;
      this.engravings.set(engravingId, newMesh);
      this.engravings.delete(newId);
    }
  }

  removeEngraving(engravingId: string): boolean {
    const textMesh = this.engravings.get(engravingId);
    
    if (!textMesh) {
      return false;
    }

    // Remove from scene
    const parent = textMesh.parent;
    if (parent) {
      parent.remove(textMesh);
    }

    // Dispose geometry and material
    textMesh.geometry.dispose();
    if (Array.isArray(textMesh.material)) {
      textMesh.material.forEach(mat => mat.dispose());
    } else {
      textMesh.material.dispose();
    }

    // Remove from storage
    this.engravings.delete(engravingId);

    return true;
  }

  getEngraving(engravingId: string): THREE.Mesh | undefined {
    return this.engravings.get(engravingId);
  }

  getAllEngravings(): Map<string, THREE.Mesh> {
    return this.engravings;
  }

  clearAllEngravings(): void {
    for (const engravingId of this.engravings.keys()) {
      this.removeEngraving(engravingId);
    }
  }

  moveEngraving(engravingId: string, position: THREE.Vector3): void {
    const textMesh = this.engravings.get(engravingId);
    if (textMesh) {
      textMesh.position.copy(position);
    }
  }

  rotateEngraving(engravingId: string, rotation: THREE.Euler): void {
    const textMesh = this.engravings.get(engravingId);
    if (textMesh) {
      textMesh.rotation.copy(rotation);
    }
  }

  scaleEngraving(engravingId: string, scale: number | THREE.Vector3): void {
    const textMesh = this.engravings.get(engravingId);
    if (textMesh) {
      if (typeof scale === 'number') {
        textMesh.scale.setScalar(scale);
      } else {
        textMesh.scale.copy(scale);
      }
    }
  }

  getAvailableFonts(): string[] {
    return Array.from(this.fontPaths.keys());
  }

  async preloadFonts(fontNames?: string[]): Promise<void> {
    const fontsToLoad = fontNames || this.getAvailableFonts();
    
    await Promise.all(
      fontsToLoad.map(fontName => this.loadFont(fontName).catch(err => {
        logger.warn('Failed to preload font', {
          error: err,
          fontName,
        });
      }))
    );
  }

  createCurvedText(text: string, radius: number, options: Partial<TextEngravingOptions> = {}): Promise<string> {
    // Create text along a curve
    const curve = new THREE.EllipseCurve(
      0, 0,
      radius, radius,
      0, Math.PI * 2,
      false,
      0
    );

    const points = curve.getPoints(Math.max(text.length, 1));
    const startPoint = points[0] ?? new THREE.Vector2(0, radius);

    return this.engraveText({
      text,
      position: options.position ?? new THREE.Vector3(startPoint.x, 0, startPoint.y),
      ...options,
    });
  }

  createCircularText(text: string, radius: number, options: Partial<TextEngravingOptions> = {}): Promise<string[]> {
    // Create text arranged in a circle
    const angleStep = (Math.PI * 2) / text.length;

    const promises = text.split('').map(async (char, index) => {
      const angle = angleStep * index;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      
      const id = await this.engraveText({
        text: char,
        position: new THREE.Vector3(x, 0, z),
        rotation: new THREE.Euler(0, angle + Math.PI / 2, 0),
        ...options,
      });
      
      return id;
    });

    return Promise.all(promises);
  }

  exportEngravings(): string {
    const engravingsData = Array.from(this.engravings.entries()).map(([id, mesh]) => ({
      id,
      position: mesh.position.toArray(),
      rotation: mesh.rotation.toArray(),
      scale: mesh.scale.toArray(),
      material: mesh.material instanceof THREE.MeshStandardMaterial ? {
        color: mesh.material.color.getHexString(),
        metalness: mesh.material.metalness,
        roughness: mesh.material.roughness,
      } : null,
    }));

    return JSON.stringify(engravingsData, null, 2);
  }

  async importEngravings(engravingsJson: string): Promise<void> {
    try {
      const engravingsData = JSON.parse(engravingsJson);
      
      // Clear existing engravings
      this.clearAllEngravings();

      // Import each engraving
      for (const data of engravingsData) {
        // This is simplified - full implementation would need text/font data
        logger.debug('Importing engraving', {
          engravingId: data.id,
        });
      }
    } catch (error) {
      logger.error('Error importing engravings', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  calculateTextBounds(text: string, font: string, size: number): THREE.Box3 {
    // Approximate text bounds calculation
    const charWidth = size * 0.6;
    const width = text.length * charWidth;
    const height = size;
    const depth = size * 0.1;

    return new THREE.Box3(
      new THREE.Vector3(-width / 2, -height / 2, 0),
      new THREE.Vector3(width / 2, height / 2, depth)
    );
  }

  dispose(): void {
    this.clearAllEngravings();
    this.loadedFonts.clear();
  }
}

export default TextEngraver3D;
